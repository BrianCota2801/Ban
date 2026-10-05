import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, variants } from "@/db/schema";

/** Marca un pedido como pagado (idempotente). */
export async function markOrderPaid(orderId: string, provider: string, ref: string | null) {
  await db
    .update(orders)
    .set({ status: "paid", paidAt: new Date(), paymentProvider: provider, paymentRef: ref })
    .where(and(eq(orders.id, orderId), eq(orders.status, "pending_payment")));
}

export async function rememberPaymentSession(orderId: string, provider: string, ref: string) {
  await db.update(orders).set({ paymentProvider: provider, paymentRef: ref }).where(eq(orders.id, orderId));
}

/**
 * Cancela un pedido y regresa las piezas al inventario (una sola vez).
 * Con `onlyPendingSession`, solo cancela si sigue sin pagar y esa es su sesión de pago más reciente.
 */
export async function cancelOrder(orderId: string, onlyPendingSession?: string) {
  await db.transaction(async (tx) => {
    const cond = onlyPendingSession
      ? and(eq(orders.id, orderId), eq(orders.status, "pending_payment"), eq(orders.paymentRef, onlyPendingSession))
      : and(eq(orders.id, orderId), sql`${orders.status} <> 'cancelled'`);
    const [o] = await tx.update(orders).set({ status: "cancelled" }).where(cond).returning({ id: orders.id });
    if (!o) return;
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const it of items) {
      if (it.variantId)
        await tx
          .update(variants)
          .set({ stock: sql`${variants.stock} + ${it.quantity}` })
          .where(eq(variants.id, it.variantId));
    }
  });
}

export async function getOrderForViewer(orderId: string, token: string | undefined, userId: string | undefined, isAdmin: boolean) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const [o] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!o) return null;
  const allowed = isAdmin || (token && token === o.accessToken) || (userId && o.userId === userId);
  if (!allowed) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, o.id));
  return { ...o, items };
}
