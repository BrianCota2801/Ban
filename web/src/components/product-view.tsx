"use client";

import { useState } from "react";
import type { Fit } from "@/db/schema";
import { isVideo } from "@/lib/media-url";
import { AddToCart } from "./add-to-cart";
import { FavoriteButton } from "./favorite-button";
import { TeeArt } from "./tee-art";

type Img = { src: string; color: string | null };
type V = { id: string; color: string; colorHex: string; size: string; stock: number };

/** Galería + selector: al cambiar de color se muestran las fotos de ese color. */
export function ProductView({
  productId,
  favorite,
  initialColor,
  name,
  fit,
  images,
  variants,
  colors,
  disabled,
  children,
}: {
  productId: string;
  favorite: boolean;
  initialColor?: string;
  name: string;
  fit: Fit;
  images: Img[];
  variants: V[];
  colors: { name: string; hex: string }[];
  disabled: boolean;
  children: React.ReactNode;
}) {
  const [color, setColor] = useState(initialColor ?? colors[0]?.name ?? "");
  const [slide, setSlide] = useState(0);
  const forColor = images.filter((i) => i.color === color);
  // Fotos del color elegido; si no tiene, las generales; si tampoco hay, la silueta en ese color.
  const shown = forColor.length ? forColor : images.filter((i) => !i.color);
  const hex = colors.find((c) => c.name === color)?.hex ?? "#f5f5f5";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <div className="min-w-0">
        {shown.length ? (
          <>
            {/* Celular: deslizable. Computadora: cuadrícula. */}
            <div
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0"
              onScroll={(e) => {
                const el = e.currentTarget;
                setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth * 0.88)));
              }}
            >
              {shown.map((img, i) => (
                <div
                  key={img.src}
                  className={`r-card aspect-[4/5] w-[88%] shrink-0 snap-center overflow-hidden bg-tile sm:w-auto ${i === 0 && shown.length % 2 === 1 ? "sm:col-span-2 sm:aspect-[5/4]" : ""}`}
                >
                  {isVideo(img.src) ? (
                    <video src={img.src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                  ) : (
                    <img src={img.src} alt={`${name}, ${color}`} className="h-full w-full object-cover" loading={i ? "lazy" : "eager"} />
                  )}
                </div>
              ))}
            </div>
            {shown.length > 1 && (
              <div className="mt-3 flex justify-center gap-1.5 sm:hidden" aria-hidden="true">
                {shown.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full bg-ink transition-all ${i === slide ? "w-5" : "w-1.5 opacity-25"}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="r-card aspect-[4/5] overflow-hidden bg-tile sm:aspect-[5/4]">
            <TeeArt fit={fit} color={hex} className="h-full w-full p-10" />
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        {children}
        <div className="mt-8">
          <AddToCart
            variants={variants}
            colors={colors}
            disabled={disabled}
            initialColor={initialColor}
            onColorChange={(c) => {
              setColor(c);
              setSlide(0);
            }}
            extra={<FavoriteButton productId={productId} initial={favorite} size="lg" label="Favorito" />}
          />
        </div>
      </div>
    </div>
  );
}
