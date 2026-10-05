import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { cartItems, carts, coupons, productImages, products, variants } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { imageSrc } from "./catalog";
import { computeTotals, type Totals } from "./pricing";
import { getSettings } from "./settings";

export const CART_COOKIE = "ban_cart";
export const MAX_QTY = 10;

export type CartLine = {
  itemId: number;
  variantId: string;
  quantity: number;
  productName: string;
  slug: string;
  fit: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  unitPrice: number;
  stock: number;
  image: string | null;
  purchasable: boolean;
};

export type Cart = { id: string | null; couponCode: string | null; lines: CartLine[]; count: number; totals: Totals };

async function readCartId() {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}

export async function loadCart(): Promise<Cart> {
  const settings = await getSettings();
  const shipping = { flat: settings.shippingFlat, freeFrom: settings.freeShippingFrom };
  const id = await readCartId();
  const [cart] = id ? await db.select().from(carts).where(eq(carts.id, id)).limit(1) : [];
  if (!cart) return { id: null, couponCode: null, lines: [], count: 0, totals: computeTotals(0, null, false, shipping) };

  const rows = await db
    .select({
      itemId: cartItems.id,
      variantId: variants.id,
      quantity: cartItems.quantity,
      productId: products.id,
      productName: products.name,
      slug: products.slug,
      fit: products.fit,
      status: products.status,
      releaseAt: products.releaseAt,
      color: variants.color,
      colorHex: variants.colorHex,
      size: variants.size,
      sku: variants.sku,
      unitPrice: products.price,
      stock: variants.stock,
    })
    .from(cartItems)
    .innerJoin(variants, eq(variants.id, cartItems.variantId))
    .innerJoin(products, eq(products.id, variants.productId))
    .where(eq(cartItems.cartId, cart.id))
    .orderBy(asc(cartItems.id));

  const productIds = [...new Set(rows.map((r) => r.productId))];
  const imgs = productIds.length
    ? await db.select().from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder))
    : [];
  const now = Date.now();
  const lines: CartLine[] = rows.map((r) => ({
    itemId: r.itemId,
    variantId: r.variantId,
    quantity: r.quantity,
    productName: r.productName,
    slug: r.slug,
    fit: r.fit,
    color: r.color,
    colorHex: r.colorHex,
    size: r.size,
    sku: r.sku,
    unitPrice: r.unitPrice,
    stock: r.stock,
    image: imageSrc(
      imgs.find((i) => i.productId === r.productId && i.color === r.color) ?? imgs.find((i) => i.productId === r.productId),
    ),
    purchasable: r.status === "active" && !(r.releaseAt && r.releaseAt.getTime() > now) && r.stock >= r.quantity,
  }));

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const [coupon] = cart.couponCode
    ? await db.select().from(coupons).where(eq(coupons.code, cart.couponCode)).limit(1)
    : [];
  return {
    id: cart.id,
    couponCode: cart.couponCode,
    lines,
    count: lines.reduce((s, l) => s + l.quantity, 0),
    totals: computeTotals(subtotal, coupon ?? null, !!cart.couponCode, shipping),
  };
}

/** Solo desde acciones del servidor: crea el carrito si no existe y fija la cookie. */
export async function ensureCartId(): Promise<string> {
  const existing = await readCartId();
  if (existing) {
    const [row] = await db.select({ id: carts.id }).from(carts).where(eq(carts.id, existing)).limit(1);
    if (row) return row.id;
  }
  const id = randomBytes(24).toString("base64url");
  const user = await getCurrentUser();
  await db.insert(carts).values({ id, userId: user?.id ?? null });
  (await cookies()).set(CART_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return id;
}

/** Al iniciar sesión: une el carrito de invitado con el que el usuario dejó en otra visita. */
export async function attachCartToUser(userId: string) {
  const current = await readCartId();
  const [previous] = await db
    .select()
    .from(carts)
    .where(current ? and(eq(carts.userId, userId), ne(carts.id, current)) : eq(carts.userId, userId))
    .orderBy(sql`${carts.updatedAt} desc`)
    .limit(1);

  if (!current) {
    if (previous)
      (await cookies()).set(CART_COOKIE, previous.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 60,
      });
    return;
  }
  await db.update(carts).set({ userId }).where(eq(carts.id, current));
  if (previous) {
    const old = await db.select().from(cartItems).where(eq(cartItems.cartId, previous.id));
    for (const item of old) {
      await db
        .insert(cartItems)
        .values({ cartId: current, variantId: item.variantId, quantity: item.quantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.variantId],
          set: { quantity: sql`least(${cartItems.quantity} + ${item.quantity}, ${MAX_QTY})` },
        });
    }
    await db.delete(carts).where(eq(carts.id, previous.id));
  }
}
