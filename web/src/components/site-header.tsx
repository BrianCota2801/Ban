import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { Suspense } from "react";
import { BagIcon, UserIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";

const NAV = [
  { href: "/productos", label: "Todo" },
  { href: "/productos?corte=oversize", label: "Oversize" },
  { href: "/productos?corte=regular", label: "Regular" },
  { href: "/productos?corte=boxy", label: "Boxy" },
  { href: "/drops", label: "Drops" },
];

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-black uppercase leading-none tracking-[0.08em] [font-stretch:125%] ${className}`}>BAN</span>
  );
}

export async function SiteHeader() {
  const [user, cart] = await Promise.all([getCurrentUser(), loadCart()]);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-x flex h-14 items-center gap-6 md:h-16">
        <Suspense fallback={<div className="w-7 md:hidden" />}>
          <MobileMenu nav={NAV} accountHref={user ? "/cuenta" : "/login"} accountLabel={user ? "Mi cuenta" : "Iniciar sesión"} />
        </Suspense>

        <Link href="/" aria-label="BAN, inicio">
          <Logo className="text-2xl md:text-[28px]" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[13px] font-bold uppercase tracking-wider hover:underline hover:underline-offset-8">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {user?.role === "admin" && (
            <Link href="/admin" className="hidden text-xs font-bold uppercase tracking-wider text-muted hover:text-ink sm:block">
              Panel
            </Link>
          )}
          <Link href={user ? "/cuenta" : "/login"} aria-label={user ? "Mi cuenta" : "Iniciar sesión"} className="p-1">
            <UserIcon />
          </Link>
          <Link href="/carrito" aria-label={`Carrito, ${cart.count} artículos`} className="relative p-1">
            <BagIcon />
            {cart.count > 0 && (
              <span className="absolute -right-1 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                {cart.count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
