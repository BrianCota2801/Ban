import "./env";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import { databaseUrl, db } from "../src/db";

const url = databaseUrl();
const migrationsFolder = "./drizzle";

if (url.startsWith("pglite:")) {
  await migratePglite(db as never, { migrationsFolder });
} else {
  await migratePostgres(db, { migrationsFolder });
}
console.log("Migraciones aplicadas.");
process.exit(0);
