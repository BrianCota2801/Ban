import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/nav";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel BAN" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-screen bg-[#f6f6f4] md:grid md:grid-cols-[220px_1fr]">
      <aside className="relative border-b border-line bg-white md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex h-14 items-center justify-between px-5 md:h-16">
          <Link href="/admin" className="text-xl font-black uppercase tracking-[0.08em] [font-stretch:125%]">
            BAN <span className="ml-1 align-middle text-[10px] font-bold tracking-widest text-muted [font-stretch:100%]">PANEL</span>
          </Link>
        </div>
        <AdminNav />
        <div className="hidden px-5 py-4 text-xs text-muted md:absolute md:bottom-0 md:block">
          <p className="truncate">{admin.email}</p>
          <div className="mt-2 flex gap-3">
            <Link href="/" className="hover:text-ink">Ver tienda</Link>
            <form action={logout}>
              <button type="submit" className="hover:text-ink">Salir</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-8 md:px-10">{children}</div>
    </div>
  );
}
