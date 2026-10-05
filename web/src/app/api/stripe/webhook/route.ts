import { cancelOrder, markOrderPaid } from "@/lib/orders";
import { verifyStripeSignature } from "@/lib/payments";

type Session = { id: string; payment_status?: string; metadata?: { order_id?: string } };

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook no configurado", { status: 503 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return new Response("Firma inválida", { status: 400 });
  }
  const event = JSON.parse(payload) as { type: string; data: { object: Session } };
  const s = event.data.object;
  const orderId = s.metadata?.order_id;
  if (!orderId) return Response.json({ received: true });

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      if (s.payment_status === "paid") await markOrderPaid(orderId, "stripe", s.id);
      break;
    case "checkout.session.async_payment_failed":
    case "checkout.session.expired":
      await cancelOrder(orderId, s.id);
      break;
  }
  return Response.json({ received: true });
}
