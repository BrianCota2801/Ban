"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, carts, coupons, products, variants } from "@/db/schema";
import { CART_COOKIE, ensureCartId, loadCart, MAX_QTY } from "@/lib/cart";
import { str, type FormState } from "@/lib/forms";
import { evaluateCoupon } from "@/lib/pricing";

const qtySchema = z.coerce.number().int().min(0).max(MAX_QTY);

export async function addToCart(_: FormState, fd: FormData): Promise<FormState> {
  const variantId = z.string().uuid().safeParse(str(fd, "variantId"));
  const qty = qtySchema.safeParse(fd.get("quantity") ?? 1);
  if (!variantId.success) return { ok: false, message: "Elige color y talla." };
  if (!qty.success || qty.data < 1) return { ok: false, message: "Cantidad no válida." };

  const [v] = await db
    .select({ id: variants.id, stock: variants.stock, status: products.status, releaseAt: products.releaseAt })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(eq(variants.id, variantId.data))
    .limit(1);
  if (!v || v.status !== "active") return { ok: false, message: "Este producto ya no está disponible." };
  if (v.releaseAt && v.releaseAt > new Date()) return { ok: false, message: "Este drop todavía no sale a la venta." };

  const cartId = await ensureCartId();
  const [existing] = await db
    .select({ quantity: cartItems.quantity })
    .from(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, v.id)));
  const wanted = (existing?.quantity ?? 0) + qty.data;
  if (wanted > v.stock)
    return { ok: false, message: v.stock <= 0 ? "Esta talla está agotada." : `Solo quedan ${v.stock} piezas de esta talla.` };
  if (wanted > MAX_QTY) return { ok: false, message: `Máximo ${MAX_QTY} piezas por talla.` };

  await db
    .insert(cartItems)
    .values({ cartId, variantId: v.id, quantity: qty.data })
    .onConflictDoUpdate({ target: [cartItems.cartId, cartItems.variantId], set: { quantity: wanted } });
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  revalidatePath("/", "layout");
  return { ok: true, message: "Agregado al carrito." };
}

async function ownedItem(itemId: number) {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId || !Number.isInteger(itemId)) return null;
  const [row] = await db
    .select({ id: cartItems.id, stock: variants.stock })
    .from(cartItems)
    .innerJoin(variants, eq(variants.id, cartItems.variantId))
    .where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cartId)));
  return row ?? null;
}

export async function updateCartItem(fd: FormData) {
  const item = await ownedItem(Number(fd.get("itemId")));
  const qty = qtySchema.safeParse(fd.get("quantity"));
  if (!item || !qty.success) return;
  if (qty.data === 0) await db.delete(cartItems).where(eq(cartItems.id, item.id));
  else await db.update(cartItems).set({ quantity: Math.min(qty.data, Math.max(item.stock, 1)) }).where(eq(cartItems.id, item.id));
  revalidatePath("/", "layout");
}

export async function removeCartItem(fd: FormData) {
  const item = await ownedItem(Number(fd.get("itemId")));
  if (item) await db.delete(cartItems).where(eq(cartItems.id, item.id));
  revalidatePath("/", "layout");
}

export async function applyCoupon(_: FormState, fd: FormData): Promise<FormState> {
  const code = str(fd, "code").toUpperCase().replace(/\s+/g, "");
  if (!code) return { ok: false, message: "Escribe un código." };
  const cart = await loadCart();
  if (!cart.id) return { ok: false, message: "Tu carrito está vacío." };
  const [coupon] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
  const res = evaluateCoupon(coupon ?? null, cart.totals.subtotal);
  if (res.error) return { ok: false, message: res.error };
  await db.update(carts).set({ couponCode: code }).where(eq(carts.id, cart.id));
  revalidatePath("/", "layout");
  return { ok: true, message: "Código aplicado." };
}

export async function removeCoupon() {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (cartId) await db.update(carts).set({ couponCode: null }).where(eq(carts.id, cartId));
  revalidatePath("/", "layout");
}
