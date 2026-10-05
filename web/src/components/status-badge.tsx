import type { OrderStatus } from "@/db/schema";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const STYLE: Record<OrderStatus, string> = {
  pending_payment: "border-warn text-warn",
  paid: "border-ok text-ok",
  preparing: "border-ink text-ink",
  shipped: "border-ink bg-ink text-white",
  delivered: "border-ok bg-ok text-white",
  cancelled: "border-line text-muted line-through",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}
