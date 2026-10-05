import { count, desc } from "drizzle-orm";
import { PageHead, td, th } from "@/components/admin/ui";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { formatDate } from "@/lib/dates";

export const metadata = { title: "Suscriptores" };

export default async function SubscribersAdmin() {
  const [list, bySource] = await Promise.all([
    db.select().from(waitlist).orderBy(desc(waitlist.createdAt)).limit(500),
    db.select({ source: waitlist.source, n: count() }).from(waitlist).groupBy(waitlist.source),
  ]);
  return (
    <>
      <PageHead title="Suscriptores">
        <a href="/admin/suscriptores/csv" className="btn-outline btn-sm">Descargar CSV</a>
      </PageHead>
      <div className="mb-6 flex flex-wrap gap-3">
        {bySource.map((s) => (
          <div key={s.source} className="border border-line bg-white px-4 py-3">
            <p className="text-xs text-muted">{s.source === "newsletter" ? "Newsletter" : s.source.startsWith("drop:") ? `Drop ${s.source.slice(5)}` : s.source}</p>
            <p className="num text-xl font-black">{s.n}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b border-line"><tr><th className={th}>Correo</th><th className={th}>Origen</th><th className={th}>Fecha</th></tr></thead>
          <tbody className="divide-y divide-line">
            {list.map((w) => (
              <tr key={w.id}><td className={td}>{w.email}</td><td className={`${td} text-muted`}>{w.source}</td><td className={`${td} text-muted`}>{formatDate(w.createdAt)}</td></tr>
            ))}
            {!list.length && <tr><td colSpan={3} className="p-8 text-center text-muted">Aún no hay suscriptores.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
