"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  audit,
  clearLoginFailures,
  clientInfo,
  createSession,
  destroyAllSessions,
  destroySession,
  isLoginBlocked,
  recordLoginFailure,
  requireUser,
} from "@/lib/auth";
import { attachCartToUser } from "@/lib/cart";
import { fieldErrors, str, type FormState } from "@/lib/forms";
import { dummyHash, hashPassword, PASSWORD_MIN, verifyPassword } from "@/lib/password";

const COMMON = new Set(["1234567890", "contraseña", "contrasena1", "password123", "qwertyuiop", "12345678910"]);

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Usa al menos ${PASSWORD_MIN} caracteres.`)
  .max(200, "Demasiado larga.")
  .refine((v) => !COMMON.has(v.toLowerCase()), "Esa contraseña es demasiado común.");

const emailSchema = z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200);

/** Solo permite volver a rutas internas, para evitar redirecciones a otros sitios. */
function safeNext(v: string) {
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : "/cuenta";
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(str(fd, "email"));
  const password = String(fd.get("password") ?? "");
  const values = { email: str(fd, "email") };
  if (!email.success || !password) return { ok: false, values, message: "Escribe tu correo y contraseña." };
  const { ip } = await clientInfo();

  if (await isLoginBlocked(email.data, ip))
    return { ok: false, values, message: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." };

  const [user] = await db.select().from(users).where(eq(users.email, email.data)).limit(1);
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash()));
  if (!user || !valid) {
    await recordLoginFailure(email.data, ip);
    return { ok: false, values, message: "Correo o contraseña incorrectos." };
  }

  await clearLoginFailures(email.data);
  await createSession(user);
  await attachCartToUser(user.id);
  if (user.role === "admin") await audit(user.id, "admin.login", { ip });
  redirect(safeNext(str(fd, "next") || (user.role === "admin" ? "/admin" : "/cuenta")));
}

const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Escribe tu nombre.").max(120),
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
    terms: z.literal("on", { message: "Debes aceptar los términos y el aviso de privacidad." }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Las contraseñas no coinciden." });

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: str(fd, "name"),
    email: str(fd, "email"),
    password: String(fd.get("password") ?? ""),
    confirm: String(fd.get("confirm") ?? ""),
    terms: fd.get("terms") ?? undefined,
  });
  const values = { name: str(fd, "name"), email: str(fd, "email") };
  if (!parsed.success) return { ok: false, values, errors: fieldErrors(parsed.error.issues) };

  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (exists) return { ok: false, values, errors: { email: "Ya existe una cuenta con ese correo. Inicia sesión." } };

  const [user] = await db
    .insert(users)
    .values({ name: parsed.data.name, email: parsed.data.email, passwordHash: await hashPassword(parsed.data.password) })
    .returning();
  await createSession(user);
  await attachCartToUser(user.id);
  redirect(safeNext(str(fd, "next")));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const next = passwordSchema.safeParse(String(fd.get("password") ?? ""));
  if (!next.success) return { ok: false, errors: { password: next.error.issues[0].message } };
  if (next.data !== String(fd.get("confirm") ?? "")) return { ok: false, errors: { confirm: "Las contraseñas no coinciden." } };

  const [user] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);
  if (!(await verifyPassword(String(fd.get("current") ?? ""), user.passwordHash)))
    return { ok: false, errors: { current: "La contraseña actual no es correcta." } };

  await db.update(users).set({ passwordHash: await hashPassword(next.data) }).where(eq(users.id, me.id));
  // Cierra todas las demás sesiones abiertas con la contraseña anterior.
  await destroyAllSessions(me.id);
  await createSession(user);
  await audit(me.id, "user.password_changed");
  return { ok: true, message: "Contraseña actualizada. Cerramos tus otras sesiones." };
}
