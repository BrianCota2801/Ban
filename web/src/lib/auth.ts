import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { auditLog, loginAttempts, sessions, users, type User } from "@/db/schema";

export const SESSION_COOKIE = "ban_session";
const CUSTOMER_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const ADMIN_TTL_MS = 12 * 60 * 60 * 1000;

const LOCK_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_EMAIL = 5;
const MAX_FAILS_PER_IP = 25;

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

function sha256(v: string) {
  return createHash("sha256").update(v).digest("hex");
}

export async function clientInfo() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
  return { ip, userAgent: (h.get("user-agent") ?? "").slice(0, 300) };
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const token = randomBytes(32).toString("base64url");
  const ttl = user.role === "admin" ? ADMIN_TTL_MS : CUSTOMER_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  const { ip, userAgent } = await clientInfo();
  await db.insert(sessions).values({ id: sha256(token), userId: user.id, expiresAt, ip, userAgent });
  // Limpieza oportunista de sesiones vencidas.
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Usuario de la sesión actual (una consulta por petición). */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
});

export async function requireUser(next = "/cuenta"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Protege el panel: sin sesión manda al login; sin rol de admin responde 404 para no revelar el panel. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") notFound();
  return user;
}

// ─── Límite de intentos de inicio de sesión ─────────────────────────────────

export async function isLoginBlocked(email: string, ip: string) {
  const since = new Date(Date.now() - LOCK_WINDOW_MS);
  const [byEmail] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, `email:${email}`), gt(loginAttempts.createdAt, since)));
  const [byIp] = await db
    .select({ n: count() })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.key, `ip:${ip}`), gt(loginAttempts.createdAt, since)));
  return byEmail.n >= MAX_FAILS_PER_EMAIL || byIp.n >= MAX_FAILS_PER_IP;
}

export async function recordLoginFailure(email: string, ip: string) {
  await db.insert(loginAttempts).values([{ key: `email:${email}` }, { key: `ip:${ip}` }]);
  await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}

export async function clearLoginFailures(email: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.key, `email:${email}`));
}

export async function audit(userId: string | null, action: string, detail?: unknown) {
  await db.insert(auditLog).values({ userId, action, detail: detail ?? null });
}
