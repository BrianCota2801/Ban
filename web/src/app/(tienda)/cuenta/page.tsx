import { desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { ChangePasswordForm } from "@/components/auth-forms";
import { StatusBadge } from "@/components/status-badge";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Mi cuenta", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUser("/cuenta");
  const mine = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(50);
  return (
    <div className="container-x max-w-4xl py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-muted">Mi cuenta</p>
          <h1 className="mt-2 text-3xl font-black">Hola, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-outline btn-sm">Cerrar sesión</button>
        </form>
      </div>

      <section className="mt-12">
        <h2 className="h-section">Mis pedidos</h2>
        {mine.length ? (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {mine.map((o) => (
              <li key={o.id}>
                <Link href={`/pedido/${o.id}?t=${o.accessToken}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-tile/60">
                  <span className="font-bold">BAN-{o.number}</span>
                  <span className="text-sm text-muted">{formatDate(o.createdAt)}</span>
                  <StatusBadge status={o.status} />
                  <span className="font-bold">{money(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Todavía no tienes pedidos. <Link href="/productos" className="link">Ver playeras</Link>
          </p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="h-section">Seguridad</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>
    </div>
  );
}
