// Crea o actualiza un administrador.
// Uso: npm run admin:create -- correo@dominio.com "contraseña larga" "Nombre"
// Sin argumentos usa ADMIN_EMAIL y ADMIN_PASSWORD del archivo .env.
import "./env";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword, PASSWORD_MIN } from "../src/lib/password";

export async function upsertAdmin(email: string, password: string, name = "Administrador", onlyIfMissing = false) {
  email = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("Correo no válido.");
  if (password.length < 12) throw new Error(`La contraseña del admin debe tener al menos 12 caracteres (mínimo general: ${PASSWORD_MIN}).`);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing && onlyIfMissing) return "ya existía (sin cambios)";
  const passwordHash = await hashPassword(password);
  if (existing) {
    await db.update(users).set({ role: "admin", passwordHash }).where(eq(users.id, existing.id));
    return "actualizado";
  }
  await db.insert(users).values({ email, name, passwordHash, role: "admin" });
  return "creado";
}

if (process.argv[1]?.endsWith("create-admin.ts")) {
  const [email = process.env.ADMIN_EMAIL, password = process.env.ADMIN_PASSWORD, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Falta correo o contraseña. Uso: npm run admin:create -- correo contraseña [nombre]");
    process.exit(1);
  }
  upsertAdmin(email, password, name)
    .then((r) => {
      console.log(`Administrador ${email} ${r}.`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e.message);
      process.exit(1);
    });
}
