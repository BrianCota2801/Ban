import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzlePostgres<typeof schema>>;

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
  const client = postgres(u.toString(), {
    // prepare: false es necesario con el pooler de Supabase (modo transacción).
    prepare: false,
    max: Number(process.env.DATABASE_POOL_MAX) || 3,
    ssl: local ? false : "require",
    // En Vercel la función se congela entre visitas y las conexiones abiertas mueren.
    // Cerramos las inactivas pronto y no esperamos indefinidamente a conectar.
    idle_timeout: 5,
    connect_timeout: 10,
    max_lifetime: 60 * 5,
  });
  return drizzlePostgres(client, { schema });
}

// En desarrollo Next recarga módulos; reutilizamos la conexión.
const g = globalThis as unknown as { __banDb?: DB };
export const db: DB = g.__banDb ?? (g.__banDb = connect());
export { schema };
