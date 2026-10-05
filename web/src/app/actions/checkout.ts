"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { cartItems, coupons, orderItems, orders, variants } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { fieldErrors, str, type FormState } from "@/lib/forms";
import { markOrderPaid, rememberPaymentSession } from "@/lib/orders";
import { createStripeCheckout, stripeEnabled } from "@/lib/payments";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido.").max(200),
  name: z.string().trim().min(3, "Escribe nombre y apellido.").max(120),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s()-]/g, ""))
    .pipe(z.string().regex(/^\+?\d{10,13}$/, "Escribe un teléfono de 10 dígitos.")),
  street: z.string().trim().min(3, "Escribe calle y número.").max(200),
  neighborhood: z.string().trim().min(2, "Escribe la colonia.").max(120),
  city: z.string().trim().min(2, "Escribe la ciudad o municipio.").max(120),
  state: z.string().trim().min(2, "Elige el estado.").max(60),
  zip: z.string().trim().regex(/^\d{5}$/, "El código postal tiene 5 dígitos."),
  notes: z.string().trim().max(300).optional().default(""),
});

class CheckoutError extends Error {}

const FIELDS = ["email", "name", "phone", "street", "neighborhood", "city", "state", "zip", "notes"] as const;

export async function placeOrder(_: FormState, fd: FormData): Promise<FormState> {
  const values = Object.fromEntries(FIELDS.map((k) => [k, str(fd, k)]));
  const parsed = schema.safeParse(values);
  if (!parsed.success) return { ok: false, values, errors: fieldErrors(parsed.error.issues), message: "Revisa los datos marcados." };
  const d = parsed.data;

  const cart = await loadCart();
  if (!cart.id || !cart.lines.length) return { ok: false, values, message: "Tu carrito está vacío." };
  if (cart.lines.some((l) => !l.purchasable)) return { ok: false, values, message: "Algunas piezas ya no están disponibles. Revisa tu carrito." };
  if (cart.couponCode && cart.totals.couponError) return { ok: false, values, message: cart.totals.couponError };

  const user = await getCurrentUser();
  let order;
  try {
    order = await db.transaction(async (tx) => {
      // Descuenta inventario solo si alcanza; si otra persona compró antes, se cancela todo.
      for (const l of cart.lines) {
        const [ok] = await tx
          .update(variants)
          .set({ stock: sql`${variants.stock} - ${l.quantity}` })
          .where(and(eq(variants.id, l.variantId), gte(variants.stock, l.quantity)))
          .returning({ id: variants.id });
        if (!ok) throw new CheckoutError(`Se acaba de agotar ${l.productName} (${l.color}, ${l.size}).`);
      }
      if (cart.couponCode && cart.totals.discount > 0) {
        const [c] = await tx
          .update(coupons)
          .set({ uses: sql`${coupons.uses} + 1` })
          .where(and(eq(coupons.code, cart.couponCode), sql`(${coupons.maxUses} is null or ${coupons.uses} < ${coupons.maxUses})`))
          .returning({ id: coupons.id });
        if (!c) throw new CheckoutError("El código de descuento se acaba de agotar.");
      }
      const [o] = await tx
        .insert(orders)
        .values({
          accessToken: randomBytes(24).toString("base64url"),
          userId: user?.id ?? null,
          email: d.email,
          subtotal: cart.totals.subtotal,
          discount: cart.totals.discount,
          shipping: cart.totals.shipping,
          total: cart.totals.total,
          couponCode: cart.totals.discount > 0 ? cart.couponCode : null,
          shipName: d.name,
          shipPhone: d.phone,
          shipStreet: d.street,
          shipNeighborhood: d.neighborhood,
          shipCity: d.city,
          shipState: d.state,
          shipZip: d.zip,
          shipNotes: d.notes,
        })
        .returning();
      await tx.insert(orderItems).values(
        cart.lines.map((l) => ({
          orderId: o.id,
          variantId: l.variantId,
          productName: l.productName,
          color: l.color,
          size: l.size,
          sku: l.sku,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
        })),
      );
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id!));
      return o;
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { ok: false, values, message: e.message };
    throw e;
  }

  if (stripeEnabled()) redirect(await startPayment(order));
  redirect(`/pedido/${order.id}?t=${order.accessToken}`);
}

/** Reintenta el pago de un pedido pendiente. */
export async function payOrder(fd: FormData) {
  const id = str(fd, "orderId");
  const token = str(fd, "t");
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o || o.accessToken !== token || o.status !== "pending_payment" || !stripeEnabled()) redirect("/");
  redirect(await startPayment(o));
}

/** Abre una sesión de pago y la guarda como la vigente del pedido. Devuelve a dónde redirigir. */
async function startPayment(order: typeof orders.$inferSelect) {
  try {
    const session = await createStripeCheckout(order);
    await rememberPaymentSession(order.id, "stripe", session.id);
    return session.url;
  } catch {
    return `/pedido/${order.id}?t=${order.accessToken}&pago=error`;
  }
}

/** Solo en desarrollo y sin Stripe: simula el pago para probar el flujo completo. */
export async function simulatePayment(fd: FormData) {
  if (process.env.NODE_ENV === "production" || stripeEnabled()) return;
  const id = str(fd, "orderId");
  const token = str(fd, "t");
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o || o.accessToken !== token) return;
  await markOrderPaid(o.id, "demo", null);
  redirect(`/pedido/${o.id}?t=${o.accessToken}&pago=ok`);
}
