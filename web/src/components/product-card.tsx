"use client";

import Link from "next/link";
import { useState } from "react";
import type { Fit } from "@/db/schema";
import { FIT_LABEL } from "@/lib/fit";
import { isVideo, mediaSrc } from "@/lib/media-url";
import { money } from "@/lib/money";
import { FavoriteButton } from "./favorite-button";
import { TeeArt } from "./tee-art";

export type CardData = {
  id: string;
  slug: string;
  name: string;
  fit: Fit;
  collection: "core" | "drop";
  price: number;
  compareAtPrice: number | null;
  gsm: number | null;
  colors: { name: string; hex: string }[];
  image: string | null;
  colorImages: Record<string, string>;
  generalImage: string | null;
  soldOut: boolean;
  upcoming: boolean;
};

/** Tarjeta de producto: al tocar o pasar sobre un color, cambia la foto a la de ese color. */
export function ProductCard({ p, favorite }: { p: CardData; favorite: boolean }) {
  const [color, setColor] = useState<string | null>(null);
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  // Con un color elegido: su foto, o la general, o la silueta en ese color (nunca la foto de otro color).
  const src = mediaSrc(color ? p.colorImages[color] || p.generalImage : p.image);
  const hex = p.colors.find((c) => c.name === color)?.hex ?? p.colors[0]?.hex ?? "#f5f5f5";
  const href = `/productos/${p.slug}${color ? `?color=${encodeURIComponent(color)}` : ""}`;

  return (
    <div className="group relative">
      <Link href={href} className="block">
        <div className="r-card relative aspect-[4/5] overflow-hidden bg-tile">
          {src ? (
            isVideo(src) ? (
              <video key={src} src={src} muted loop playsInline autoPlay className="h-full w-full object-cover" />
            ) : (
              <img key={src} src={src} alt={color ? `${p.name}, ${color}` : p.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
            )
          ) : (
            <TeeArt fit={p.fit} color={hex} className="h-full w-full p-8 transition-transform duration-700 group-hover:scale-[1.04]" />
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
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Colores">
          {p.colors.slice(0, 6).map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={`Ver en ${c.name}`}
              aria-pressed={color === c.name}
              onMouseEnter={() => setColor(c.name)}
              onFocus={() => setColor(c.name)}
              onClick={() => setColor(c.name)}
              className={`grid h-6 w-6 place-items-center rounded-full border ${color === c.name ? "border-ink" : "border-transparent hover:border-line"}`}
            >
              <span className="h-4 w-4 rounded-full border border-black/15" style={{ background: c.hex }} />
            </button>
          ))}
          {p.colors.length > 6 && <span className="text-[11px] text-muted">+{p.colors.length - 6}</span>}
        </div>
        <FavoriteButton productId={p.id} initial={favorite} />
      </div>
      <Link href={href} className="block">
        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
          {FIT_LABEL[p.fit]}
          {p.gsm ? ` · ${p.gsm} g/m²` : ""}
          {color ? ` · ${color}` : ""}
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
