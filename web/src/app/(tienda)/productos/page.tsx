import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product-grid";
import { FITS, type Fit } from "@/db/schema";
import { FIT_LABEL, listProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Playeras", description: "Playeras heavyweight oversize, regular y boxy." };

const SORTS = {
  destacados: "Destacados",
  "precio-asc": "Precio: menor a mayor",
  "precio-desc": "Precio: mayor a menor",
} as const;

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const fit = FITS.includes(sp.corte as Fit) ? (sp.corte as Fit) : undefined;
  const sort = (sp.orden && sp.orden in SORTS ? sp.orden : "destacados") as keyof typeof SORTS;
  let items = await listProducts({ fit });
  if (sort === "precio-asc") items = [...items].sort((a, b) => a.price - b.price);
  if (sort === "precio-desc") items = [...items].sort((a, b) => b.price - a.price);

  const href = (q: { corte?: string; orden?: string }) => {
    const p = new URLSearchParams();
    const c = "corte" in q ? q.corte : fit;
    const o = "orden" in q ? q.orden : sort;
    if (c) p.set("corte", c);
    if (o && o !== "destacados") p.set("orden", o);
    const s = p.toString();
    return s ? `/productos?${s}` : "/productos";
  };

  return (
    <div className="container-x py-8 md:py-12">
      <nav className="text-xs text-muted" aria-label="Ruta">
        <Link href="/" className="hover:underline">Inicio</Link> / Playeras
      </nav>
      <h1 className="mt-3 text-3xl font-black uppercase tracking-tight md:text-4xl">{fit ? `Playeras ${FIT_LABEL[fit]}` : "Playeras"}</h1>

      <div className="sticky top-14 z-30 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-line bg-white px-4 py-3 md:top-16 md:mx-0 md:px-0">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por corte">
          <FilterPill href={href({ corte: undefined })} active={!fit}>Todos</FilterPill>
          {FITS.map((f) => (
            <FilterPill key={f} href={href({ corte: f })} active={fit === f}>{FIT_LABEL[f]}</FilterPill>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-muted">{items.length} {items.length === 1 ? "artículo" : "artículos"}</span>
          <span className="text-line">|</span>
          {Object.entries(SORTS).map(([k, label]) => (
            <Link key={k} href={href({ orden: k })} className={k === sort ? "font-bold underline underline-offset-4" : "text-muted hover:text-ink"}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <ProductGrid items={items} />
      </div>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`border px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${active ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}
    >
      {children}
    </Link>
  );
}
