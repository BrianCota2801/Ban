"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "Resumen"],
  ["/admin/inicio", "Página principal"],
  ["/admin/productos", "Productos"],
  ["/admin/pedidos", "Pedidos"],
  ["/admin/promociones", "Promociones"],
  ["/admin/suscriptores", "Suscriptores"],
  ["/admin/ajustes", "Ajustes"],
] as const;

export function AdminNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:grid md:gap-0.5 md:pb-0">
      {ITEMS.map(([href, label]) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap px-3 py-2 text-sm ${active ? "bg-ink font-bold text-white" : "text-ink hover:bg-tile"}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
