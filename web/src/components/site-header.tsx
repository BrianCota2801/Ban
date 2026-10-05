import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { getFavoriteIds } from "@/lib/favorites";
import { HeaderFavorites } from "./header-favorites";
import { BagIcon, SearchIcon, UserIcon } from "./icons";
import { MobileMenu } from "./mobile-menu";

const NAV = [
  { href: "/productos", label: "Todo" },
  { href: "/productos?corte=oversize", label: "Oversize" },
  { href: "/productos?corte=regular", label: "Regular" },
  { href: "/productos?corte=boxy", label: "Boxy" },
  { href: "/drops", label: "Drops" },
];

export function Logo({ className = "" }: { className?: string }) {
  return <span className={`font-black uppercase leading-none tracking-[0.08em] [font-stretch:125%] ${className}`}>BAN</span>;
}

const iconBtn = "relative grid h-10 w-10 place-items-center rounded-full hover:bg-tile";

export async function SiteHeader() {
  const [user, cart, favs] = await Promise.all([getCurrentUser(), loadCart(), getFavoriteIds()]);
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center gap-4 md:gap-8">
        <Suspense fallback={<div className="w-10 md:hidden" />}>
          <MobileMenu nav={NAV} accountHref={user ? "/cuenta" : "/login"} accountLabel={user ? "Mi cuenta" : "Iniciar sesión"} />
        </Suspense>

        <Link href="/" aria-label="BAN, inicio" className="shrink-0">
          <Logo className="text-[26px] md:text-[30px]" />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[13px] font-bold uppercase tracking-wider hover:underline hover:underline-offset-8">
              {n.label}
            </Link>
          ))}
        </nav>

        <form action="/buscar" role="search" className="ml-auto hidden w-full max-w-sm md:block">
          <label htmlFor="q" className="sr-only">Buscar</label>
          <div className="flex h-11 items-center rounded-full border border-line bg-white pl-5 pr-2 focus-within:border-ink">
            <input id="q" name="q" placeholder="Buscar" className="w-full bg-transparent text-[15px] outline-none" />
            <button type="submit" aria-label="Buscar" className="grid h-8 w-8 place-items-center rounded-full hover:bg-tile">
              <SearchIcon />
            </button>
          </div>
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Link href="/buscar" aria-label="Buscar" className={`${iconBtn} md:hidden`}>
            <SearchIcon className="h-[22px] w-[22px]" />
          </Link>
          <HeaderFavorites initial={favs.size} />
          <Link href={user ? "/cuenta" : "/login"} aria-label={user ? "Mi cuenta" : "Iniciar sesión"} className={`${iconBtn} hidden sm:grid`}>
            <UserIcon />
          </Link>
          <Link href="/carrito" aria-label={`Carrito, ${cart.count} artículos`} className={iconBtn}>
            <BagIcon />
            {cart.count > 0 && (
              <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-bold text-white">
                {cart.count}
              </span>
            )}
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="ml-2 hidden rounded-full border border-line px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:border-ink sm:block">
              Panel
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
