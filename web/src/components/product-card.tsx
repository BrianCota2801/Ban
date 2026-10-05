"use client";

import Link from "next/link";
import { useState } from "react";
import type { Fit } from "@/db/schema";
import { FIT_LABEL } from "@/lib/fit";
import { isVideo, mediaSrc } from "@/lib/media-url";
import { money } from "@/lib/money";
import { ColorSwatches } from "./color-swatches";
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
  // Siempre hay un color elegido (el primero al cargar) y la foto es la de ese color.
  const [color, setColor] = useState<string>(p.colors[0]?.name ?? "");
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  // Foto del color elegido, o la general, o la silueta en ese color (nunca la foto de otro color).
  const src = mediaSrc(color ? p.colorImages[color] || p.generalImage : p.image);
  const hex = p.colors.find((c) => c.name === color)?.hex ?? "#f5f5f5";
  const href = `/productos/${p.slug}${color ? `?color=${encodeURIComponent(color)}` : ""}`;

  // Precarga las fotos de los otros colores al acercarse, para que el cambio sea instantáneo.
  const preload = () => {
    for (const url of Object.values(p.colorImages)) {
      const src = mediaSrc(url);
      if (src && !isVideo(src)) new Image().src = src;
    }
  };

  return (
    <div className="group relative" onPointerEnter={preload} onTouchStart={preload}>
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
        <ColorSwatches colors={p.colors} selected={color} onSelect={setColor} hoverSelects max={6} />
        <FavoriteButton productId={p.id} initial={favorite} />
      </div>
      <Link href={href} className="block">
        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted">
          {FIT_LABEL[p.fit]}
          {p.gsm ? ` · ${p.gsm} g/m²` : ""}
          {p.colors.length > 1 && color ? ` · ${color}` : ""}
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
