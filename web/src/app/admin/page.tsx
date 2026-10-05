import { and, asc, count, desc, eq, gte, inArray, lte, sum } from "drizzle-orm";
import Link from "next/link";
import { Card, PageHead, td, th } from "@/components/admin/ui";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/db";
import { orders, products, variants, waitlist } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/money";
import { stripeEnabled } from "@/lib/payments";

const SOLD = ["paid", "preparing", "shipped", "delivered"] as const;

export default async function AdminHome() {
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(7, 0, 0, 0); // inicio de mes en hora de Sonora

  const [[month], [toShip], [unpaid], [subs], low, latest] = await Promise.all([
    db.select({ total: sum(orders.total), n: count() }).from(orders).where(and(inArray(orders.status, [...SOLD]), gte(orders.createdAt, start))),
    db.select({ n: count() }).from(orders).where(inArray(orders.status, ["paid", "preparing"])),
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending_payment")),
    db.select({ n: count() }).from(waitlist),
    db
      .select({ id: variants.id, productId: products.id, name: products.name, color: variants.color, size: variants.size, stock: variants.stock })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(and(eq(products.status, "active"), lte(variants.stock, 3)))
      .orderBy(asc(variants.stock))
      .limit(10),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(6),
  ]);

  const stats = [
    ["Ventas del mes", money(Number(month.total ?? 0)), `${month.n} pedidos pagados`],
    ["Por enviar", String(toShip.n), "pagados o en preparación"],
    ["Pendientes de pago", String(unpaid.n), "pedidos sin pagar"],
    ["Suscriptores", String(subs.n), "newsletter y drops"],
  ];

  return (
    <>
      <PageHead title="Resumen">
        <Link href="/admin/productos/nuevo" className="btn btn-sm">Nuevo producto</Link>
        <Link href="/admin/inicio" className="btn-outline btn-sm">Editar página principal</Link>
      </PageHead>

      {!stripeEnabled() && (
        <p className="mb-6 border border-warn bg-white p-4 text-sm">
          <b>Pagos en modo demostración.</b> Agrega tus claves de Stripe en las variables de entorno para cobrar de verdad.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([k, v, s]) => (
          <div key={k} className="border border-line bg-white p-5">
            <p className="text-xs text-muted">{k}</p>
            <p className="num mt-1 text-2xl font-black">{v}</p>
            <p className="mt-1 text-xs text-muted">{s}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Últimos pedidos">
          {latest.length ? (
            <div className="-mx-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr><th className={th}>Pedido</th><th className={th}>Fecha</th><th className={th}>Estado</th><th className={`${th} text-right`}>Total</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {latest.map((o) => (
                    <tr key={o.id}>
                      <td className={td}><Link href={`/admin/pedidos/${o.id}`} className="font-bold hover:underline">BAN-{o.number}</Link></td>
                      <td className={`${td} text-muted`}>{formatDate(o.createdAt)}</td>
                      <td className={td}><StatusBadge status={o.status} /></td>
                      <td className={`${td} num text-right`}>{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted">Aún no hay pedidos.</p>
          )}
        </Card>
        <Card title="Inventario bajo" help="Tallas con 3 piezas o menos en productos publicados.">
          {low.length ? (
            <ul className="divide-y divide-line text-sm">
              {low.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/productos/${v.productId}`} className="hover:underline">
                    {v.name} <span className="text-muted">· {v.color} · {v.size}</span>
                  </Link>
                  <span className={`num font-bold ${v.stock === 0 ? "text-sale" : "text-warn"}`}>{v.stock}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Todo en orden.</p>
          )}
        </Card>
      </div>
    </>
  );
}
