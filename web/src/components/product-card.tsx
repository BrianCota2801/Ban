import Link from "next/link";
import type { ProductCard as Card } from "@/lib/catalog";
import { FIT_LABEL } from "@/lib/catalog";
import { money } from "@/lib/money";
import { TeeArt } from "./tee-art";

export function ProductCard({ p }: { p: Card }) {
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  return (
    <Link href={`/productos/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-tile)]">
        {p.imageId ? (
          <img
            src={`/media/${p.imageId}`}
            alt={p.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <TeeArt fit={p.fit} color={p.colors[0]?.hex ?? "#f5f5f5"} className="h-full w-full p-8 transition-transform duration-500 group-hover:scale-[1.03]" />
        )}
        <div className="absolute left-2 top-2 flex gap-1">
          {p.upcoming && <span className="tag bg-ink text-white">Próximamente</span>}
          {!p.upcoming && p.collection === "drop" && <span className="tag bg-ink text-white">Drop</span>}
          {p.soldOut && !p.upcoming && <span className="tag bg-white text-ink">Agotado</span>}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5" aria-label="Colores">
        {p.colors.slice(0, 6).map((c) => (
          <span key={c.name} title={c.name} className="h-3 w-3 border border-black/15" style={{ background: c.hex }} />
        ))}
        {p.colors.length > 6 && <span className="text-[11px] text-muted">+{p.colors.length - 6}</span>}
      </div>
      <p className="mt-1.5 text-[11px] uppercase tracking-wider text-muted">
        {FIT_LABEL[p.fit]}
        {p.gsm ? ` · ${p.gsm} g/m²` : ""}
      </p>
      <h3 className="mt-0.5 text-sm leading-snug">{p.name}</h3>
      <p className="mt-1 text-[15px] font-bold">
        <span className={onSale ? "text-sale" : ""}>{money(p.price)}</span>
        {onSale && <s className="ml-2 text-xs font-normal text-muted">{money(p.compareAtPrice!)}</s>}
      </p>
    </Link>
  );
}

export function ProductGrid({ items }: { items: Card[] }) {
  if (!items.length) return <p className="py-12 text-center text-sm text-muted">No hay productos para mostrar.</p>;
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
      {items.map((p) => (
        <ProductCard key={p.id} p={p} />
      ))}
    </div>
  );
}
