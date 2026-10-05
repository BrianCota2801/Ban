import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "@/db/schema";

export function stripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function siteUrl() {
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return (process.env.SITE_URL || (vercel ? `https://${vercel}` : "http://localhost:3000")).replace(/\/$/, "");
}

/** Crea una sesión de Stripe Checkout (tarjeta y OXXO) por el total del pedido y devuelve la URL de pago. */
export async function createStripeCheckout(order: Order): Promise<{ url: string; id: string }> {
  const body = new URLSearchParams({
    mode: "payment",
    locale: "es-419",
    customer_email: order.email,
    client_reference_id: order.id,
    "metadata[order_id]": order.id,
    "payment_intent_data[metadata][order_id]": order.id,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "mxn",
    "line_items[0][price_data][unit_amount]": String(order.total),
    "line_items[0][price_data][product_data][name]": `Pedido BAN-${order.number}`,
    "payment_method_types[0]": "card",
    "payment_method_types[1]": "oxxo",
    success_url: `${siteUrl()}/pedido/${order.id}?t=${order.accessToken}&pago=ok`,
    cancel_url: `${siteUrl()}/pedido/${order.id}?t=${order.accessToken}`,
    expires_at: String(Math.floor(Date.now() / 1000) + 60 * 60 * 2),
  });
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `checkout-${order.id}-${Math.floor(Date.now() / 60000)}`,
    },
    body,
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
  if (!res.ok || !json.url || !json.id) throw new Error(json.error?.message ?? "No se pudo iniciar el pago.");
  return { url: json.url, id: json.id };
}

/** Verifica la firma de un webhook de Stripe (cabecera Stripe-Signature). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i), kv.slice(i + 1)];
    }),
  );
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSec) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`).digest();
  const signatures = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => Buffer.from(kv.slice(3), "hex"));
  return signatures.some((s) => s.length === expected.length && timingSafeEqual(s, expected));
}
