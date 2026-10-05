import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { favorites } from "@/db/schema";
import { getCurrentUser } from "./auth";

const GUEST_COOKIE = "ban_guest";

/** Dueño de la lista: el usuario si inició sesión; si no, el invitado de la cookie (o null si aún no hay). */
async function ownerKey(create = false): Promise<string | null> {
  const user = await getCurrentUser();
  if (user) return `u:${user.id}`;
  const jar = await cookies();
  let guest = jar.get(GUEST_COOKIE)?.value;
  if (!guest && create) {
    guest = randomBytes(18).toString("base64url");
    jar.set(GUEST_COOKIE, guest, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 180,
    });
  }
  return guest ? `g:${guest}` : null;
}

export const getFavoriteIds = cache(async (): Promise<Set<string>> => {
  const owner = await ownerKey();
  if (!owner) return new Set();
  const rows = await db.select({ id: favorites.productId }).from(favorites).where(eq(favorites.owner, owner));
  return new Set(rows.map((r) => r.id));
});

/** Solo desde acciones del servidor. Devuelve si quedó como favorito. */
export async function toggleFavoriteFor(productId: string): Promise<boolean> {
  const owner = (await ownerKey(true))!;
  const removed = await db
    .delete(favorites)
    .where(and(eq(favorites.owner, owner), eq(favorites.productId, productId)))
    .returning({ id: favorites.id });
  if (removed.length) return false;
  await db.insert(favorites).values({ owner, productId }).onConflictDoNothing();
  return true;
}

/** Al iniciar sesión, los favoritos del invitado pasan a la cuenta. */
export async function mergeGuestFavorites(userId: string) {
  const guest = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!guest) return;
  await db.execute(
    sql`insert into favorites (owner, product_id, created_at)
        select ${`u:${userId}`}, product_id, created_at from favorites where owner = ${`g:${guest}`}
        on conflict do nothing`,
  );
  await db.delete(favorites).where(eq(favorites.owner, `g:${guest}`));
}
