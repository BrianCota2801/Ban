import "./env";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { databaseUrl, db } from "../src/db";

const url = databaseUrl();
const migrationsFolder = "./drizzle";

if (url.startsWith("pglite:")) {
  await migratePglite(db as never, { migrationsFolder });
} else {
  await migratePg(db, { migrationsFolder });
}
console.log("Migraciones aplicadas.");
process.exit(0);
