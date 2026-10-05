import Link from "next/link";
import type { ProductCard as Card } from "@/lib/catalog";
import { FIT_LABEL } from "@/lib/catalog";
import { getFavoriteIds } from "@/lib/favorites";
import { isVideo, mediaSrc } from "@/lib/media-url";
import { money } from "@/lib/money";
import { FavoriteButton } from "./favorite-button";
import { TeeArt } from "./tee-art";

export function ProductCard({ p, favorite }: { p: Card; favorite: boolean }) {
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  const src = mediaSrc(p.image);
  return (
    <div className="group relative">
      <Link href={`/productos/${p.slug}`} className="block">
        <div className="r-card relative aspect-[4/5] overflow-hidden bg-tile">
          {src ? (
            isVideo(src) ? (
              <video src={src} muted loop playsInline autoPlay className="h-full w-full object-cover" />
            ) : (
              <img src={src} alt={p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            )
          ) : (
            <TeeArt fit={p.fit} color={p.colors[0]?.hex ?? "#f5f5f5"} className="h-full w-full p-8 transition-transform duration-700 group-hover:scale-[1.04]" />
          )}
          <div className="absolute left-3 top-3 flex gap-1">
            {p.upcoming && <span className="tag bg-ink text-white">Próximamente</span>}
            {!p.upcoming && p.collection === "drop" && <span className="tag bg-ink text-white">Drop</span>}
            {onSale && !p.upcoming && <span className="tag bg-sale text-white">Oferta</span>}
            {p.soldOut && !p.upcoming && <span className="tag bg-white text-ink">Agotado</span>}
          </div>
        </div>
      </Link>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Colores">
          {p.colors.slice(0, 6).map((c) => (
            <span key={c.name} title={c.name} className="h-4 w-4 rounded-full border border-black/15 ring-offset-1" style={{ background: c.hex }} />
          ))}
          {p.colors.length > 6 && <span className="text-[11px] text-muted">+{p.colors.length - 6}</span>}
        </div>
        <FavoriteButton productId={p.id} initial={favorite} />
      </div>
      <Link href={`/productos/${p.slug}`} className="block">
        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
          {FIT_LABEL[p.fit]}
          {p.gsm ? ` · ${p.gsm} g/m²` : ""}
        </p>
        <h3 className="mt-0.5 text-[15px] leading-snug">{p.name}</h3>
        <p className="mt-1 text-lg font-bold">
          <span className={onSale ? "text-sale" : ""}>{money(p.price)}</span>
          {onSale && <s className="ml-2 text-sm font-normal text-muted">{money(p.compareAtPrice!)}</s>}
        </p>
      </Link>
    </div>
  );
}

const COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

export async function ProductGrid({ items, columns = 4 }: { items: Card[]; columns?: number }) {
  if (!items.length) return <p className="py-12 text-center text-sm text-muted">No hay productos para mostrar.</p>;
  const favs = await getFavoriteIds();
  return (
    <div className={`grid gap-x-3 gap-y-10 lg:gap-x-5 ${COLS[columns] ?? COLS[4]}`}>
      {items.map((p) => (
        <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} />
      ))}
    </div>
  );
}
