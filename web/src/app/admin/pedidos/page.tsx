import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHead, td, th } from "@/components/admin/ui";
import { STATUS_LABEL, StatusBadge } from "@/components/status-badge";
import { db } from "@/db";
import { ORDER_STATUSES, orders, type OrderStatus } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/money";

export const metadata = { title: "Pedidos" };

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const status = ORDER_STATUSES.includes(estado as OrderStatus) ? (estado as OrderStatus) : undefined;
  const list = await db
    .select()
    .from(orders)
    .where(status ? eq(orders.status, status) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(200);

  return (
    <>
      <PageHead title="Pedidos" />
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        <Link href="/admin/pedidos" className={`border px-3 py-1.5 font-bold uppercase tracking-wider ${!status ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>Todos</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/pedidos?estado=${s}`} className={`border px-3 py-1.5 font-bold uppercase tracking-wider ${status === s ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line">
            <tr><th className={th}>Pedido</th><th className={th}>Fecha</th><th className={th}>Cliente</th><th className={th}>Destino</th><th className={th}>Estado</th><th className={`${th} text-right`}>Total</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((o) => (
              <tr key={o.id} className="hover:bg-tile/50">
                <td className={td}><Link href={`/admin/pedidos/${o.id}`} className="font-bold hover:underline">BAN-{o.number}</Link></td>
                <td className={`${td} text-muted`}>{formatDate(o.createdAt, true)}</td>
                <td className={td}>{o.shipName}<div className="text-xs text-muted">{o.email}</div></td>
                <td className={`${td} text-muted`}>{o.shipCity}, {o.shipState}</td>
                <td className={td}><StatusBadge status={o.status} /></td>
                <td className={`${td} num text-right font-bold`}>{money(o.total)}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={6} className="p-8 text-center text-muted">No hay pedidos{status ? " con este estado" : ""}.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
