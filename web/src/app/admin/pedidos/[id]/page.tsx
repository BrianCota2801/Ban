import { notFound } from "next/navigation";
import { updateOrder } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Card, Input, PageHead, Select } from "@/components/admin/ui";
import { STATUS_LABEL, StatusBadge } from "@/components/status-badge";
import { ORDER_STATUSES } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { getOrderForViewer } from "@/lib/orders";

export const metadata = { title: "Pedido" };

export default async function OrderAdmin({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const o = await getOrderForViewer((await params).id, undefined, admin.id, true);
  if (!o) notFound();
  const units = o.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
      <PageHead title={`Pedido BAN-${o.number}`} back={{ href: "/admin/pedidos", label: "Pedidos" }}>
        <StatusBadge status={o.status} />
      </PageHead>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-6">
          <Card title={`Artículos (${units})`}>
            <ul className="divide-y divide-line text-sm">
              {o.items.map((it) => (
                <li key={it.id} className="flex justify-between gap-4 py-3">
                  <span>
                    <b>{it.productName}</b> · {it.color} · {it.size} × {it.quantity}
                    <span className="num block text-xs text-muted">{it.sku}</span>
                  </span>
                  <span className="num">{money(it.unitPrice * it.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="ml-auto mt-4 grid max-w-xs gap-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="num">{money(o.subtotal)}</dd></div>
              {o.discount > 0 && <div className="flex justify-between"><dt className="text-muted">Descuento {o.couponCode}</dt><dd className="num text-sale">−{money(o.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd className="num">{money(o.shipping)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Total</dt><dd className="num">{money(o.total)}</dd></div>
            </dl>
          </Card>
          <Card title="Envío">
            <div className="grid gap-1 text-sm">
              <p className="font-bold">{o.shipName}</p>
              <p>{o.shipPhone} · {o.email}</p>
              <p>{o.shipStreet}, {o.shipNeighborhood}</p>
              <p>{o.shipCity}, {o.shipState}, CP {o.shipZip}</p>
              {o.shipNotes && <p className="text-muted">Referencias: {o.shipNotes}</p>}
            </div>
          </Card>
        </div>
        <div className="grid content-start gap-6">
          <Card title="Actualizar pedido">
            <ActionForm action={updateOrder}>
              <input type="hidden" name="id" value={o.id} />
              <Select label="Estado" name="status" defaultValue={o.status} options={ORDER_STATUSES.map((s) => [s, STATUS_LABEL[s]])} help="Cancelar regresa las piezas al inventario." />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Paquetería" name="carrier" defaultValue={o.carrier ?? ""} placeholder="Estafeta, DHL, FedEx…" />
                <Input label="Número de guía" name="trackingNumber" defaultValue={o.trackingNumber ?? ""} />
              </div>
            </ActionForm>
          </Card>
          <Card title="Pago">
            <dl className="grid gap-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Creado</dt><dd>{formatDate(o.createdAt, true)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Pagado</dt><dd>{o.paidAt ? formatDate(o.paidAt, true) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Medio</dt><dd>{o.paymentProvider ?? "—"}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Referencia</dt><dd className="num truncate text-xs">{o.paymentRef ?? "—"}</dd></div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
