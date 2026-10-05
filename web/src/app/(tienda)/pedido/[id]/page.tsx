import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { payOrder, simulatePayment } from "@/app/actions/checkout";
import { StatusBadge } from "@/components/status-badge";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { getOrderForViewer } from "@/lib/orders";
import { stripeEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string; pago?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ id }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  const o = await getOrderForViewer(id, sp.t, user?.id, user?.role === "admin");
  if (!o) notFound();
  const pending = o.status === "pending_payment";
  const stripe = stripeEnabled();
  const demo = !stripe && process.env.NODE_ENV !== "production";

  return (
    <div className="container-x max-w-3xl py-10 md:py-14">
      {sp.pago === "ok" && !pending && (
        <div className="mb-8 bg-ink p-6 text-white">
          <p className="eyebrow text-white/60">Gracias por tu compra</p>
          <p className="mt-2 text-xl font-bold">Recibimos tu pago. Te avisaremos cuando salga tu paquete.</p>
        </div>
      )}
      {sp.pago === "ok" && pending && (
        <div className="mb-8 border border-warn p-5 text-sm">
          Estamos confirmando tu pago. Si pagaste en OXXO, se confirma cuando la tienda lo reporte (normalmente en menos de un día).
        </div>
      )}
      {sp.pago === "error" && <div className="mb-8 border border-sale p-5 text-sm text-sale">No pudimos abrir la página de pago. Inténtalo de nuevo.</div>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black">Pedido BAN-{o.number}</h1>
        <StatusBadge status={o.status} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatDate(o.createdAt, true)}</p>

      {pending && (
        <div className="mt-8 grid gap-3 bg-tile p-6">
          <p className="font-bold">Falta el pago de {money(o.total)}.</p>
          {stripe && (
            <form action={payOrder}>
              <input type="hidden" name="orderId" value={o.id} />
              <input type="hidden" name="t" value={o.accessToken} />
              <button className="btn">Pagar ahora</button>
            </form>
          )}
          {demo && (
            <form action={simulatePayment} className="grid gap-2">
              <input type="hidden" name="orderId" value={o.id} />
              <input type="hidden" name="t" value={o.accessToken} />
              <button className="btn-outline">Simular pago (solo pruebas)</button>
              <p className="help">Este botón solo existe mientras no conectes Stripe y no estés en producción.</p>
            </form>
          )}
          {!stripe && !demo && <p className="text-sm text-muted">Te enviaremos las instrucciones de pago a {o.email}.</p>}
        </div>
      )}

      {o.trackingNumber && (
        <div className="mt-8 border border-line p-5 text-sm">
          <b>Guía:</b> {o.carrier ? `${o.carrier} · ` : ""}
          <span className="num">{o.trackingNumber}</span>
        </div>
      )}

      <section className="mt-10">
        <h2 className="label">Artículos</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line text-sm">
          {o.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-4 py-3">
              <span>
                {it.productName} <span className="text-muted">· {it.color} · {it.size} × {it.quantity}</span>
              </span>
              <span>{money(it.unitPrice * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto mt-4 grid max-w-xs gap-1.5 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Descuento {o.couponCode}</dt><dd className="text-sale">−{money(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd>{o.shipping ? money(o.shipping) : "Gratis"}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Total</dt><dd>{money(o.total)}</dd></div>
        </dl>
      </section>

      <section className="mt-10 grid gap-1 text-sm">
        <h2 className="label mb-2">Se envía a</h2>
        <p>{o.shipName} · {o.shipPhone}</p>
        <p>{o.shipStreet}, {o.shipNeighborhood}</p>
        <p>{o.shipCity}, {o.shipState} {o.shipZip}</p>
        {o.shipNotes && <p className="text-muted">{o.shipNotes}</p>}
      </section>
    </div>
  );
}
