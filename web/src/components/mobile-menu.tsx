"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CloseIcon, MenuIcon } from "./icons";

export function MobileMenu({ nav, accountHref, accountLabel }: { nav: { href: string; label: string }[]; accountHref: string; accountLabel: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => setOpen(false), [pathname, params]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button type="button" className="-ml-1 flex p-1" aria-label="Abrir menú" aria-expanded={open} onClick={() => setOpen(true)}>
        <MenuIcon />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="flex h-10 items-center justify-between">
            <span className="text-2xl font-black uppercase tracking-[0.08em] [font-stretch:125%]">BAN</span>
            <button type="button" className="p-1" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              <CloseIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6 grid">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-line py-4 text-lg font-bold uppercase tracking-wide">
                {n.label}
              </Link>
            ))}
            <Link href={accountHref} className="py-4 text-sm text-muted">
              {accountLabel}
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
