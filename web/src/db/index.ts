import { PGlite } from "@electric-sql/pglite";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { Pool } from "pg";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzlePg<typeof schema>>;

/**
 * DATABASE_URL, o POSTGRES_URL si la base se creó con la integración de Supabase en Vercel.
 * Sin ninguna, en tu computadora se usa Postgres embebido (carpeta .data).
 */
export function databaseUrl() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) return url;
  if (process.env.VERCEL) {
    const env = process.env.VERCEL_ENV ?? "?";
    throw new Error(
      `Falta la variable DATABASE_URL (o POSTGRES_URL) en Vercel. Esta publicación es de tipo "${env}" ` +
        `(rama ${process.env.VERCEL_GIT_COMMIT_REF ?? "?"}). En Settings → Environment Variables, ` +
        `revisa que DATABASE_URL tenga marcado "${env === "preview" ? "Preview" : "Production"}" y vuelve a publicar.`,
    );
  }
  return "pglite:./.data/db";
}

function connect(): DB {
  const url = databaseUrl();
  if (url.startsWith("pglite:")) {
    const client = new PGlite(url.slice("pglite:".length));
    return drizzlePglite(client, { schema }) as unknown as DB;
  }
  // Se quitan parámetros extra de la URL (p. ej. los que agrega Supabase) que Postgres no reconoce.
  const u = new URL(url);
  const local = ["localhost", "127.0.0.1"].includes(u.hostname);
  for (const k of [...u.searchParams.keys()]) u.searchParams.delete(k);
  const pool = new Pool({
    connectionString: u.toString(),
    max: Number(process.env.DATABASE_POOL_MAX) || 3,
    // Conexión cifrada. El certificado del pooler de Supabase no está en el almacén de Node, por eso no se verifica.
    ssl: local ? false : { rejectUnauthorized: false },
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
  });
  // En Vercel: mantiene viva la función hasta cerrar las conexiones inactivas,
  // para que nunca se reutilice una conexión que murió mientras la función estaba congelada.
  if (process.env.VERCEL) attachDatabasePool(pool);
  return drizzlePg(pool, { schema });
}

// En desarrollo Next recarga módulos; reutilizamos la conexión.
const g = globalThis as unknown as { __banDb?: DB };
export const db: DB = g.__banDb ?? (g.__banDb = connect());
export { schema };
