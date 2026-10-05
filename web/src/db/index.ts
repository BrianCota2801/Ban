import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = ReturnType<typeof drizzlePostgres<typeof schema>>;

const url = process.env.DATABASE_URL || "pglite:./.data/db";

function connect(): DB {
  if (url.startsWith("pglite:")) {
    // Postgres embebido para desarrollo local: no requiere instalar nada.
    const client = new PGlite(url.slice("pglite:".length));
    return drizzlePglite(client, { schema }) as unknown as DB;
  }
  const client = postgres(url, { max: 5, prepare: false });
  return drizzlePostgres(client, { schema });
}

// En desarrollo Next recarga módulos; reutilizamos la conexión.
const g = globalThis as unknown as { __banDb?: DB };
export const db: DB = g.__banDb ?? (g.__banDb = connect());
export { schema };
