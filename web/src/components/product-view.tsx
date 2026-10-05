"use client";

import { useState } from "react";
import type { Fit } from "@/db/schema";
import { AddToCart } from "./add-to-cart";
import { TeeArt } from "./tee-art";

type Img = { mediaId: string; color: string | null };
type V = { id: string; color: string; colorHex: string; size: string; stock: number };

/** Galería + selector: al cambiar de color se muestran las fotos de ese color. */
export function ProductView({
  name,
  fit,
  images,
  variants,
  colors,
  disabled,
  children,
}: {
  name: string;
  fit: Fit;
  images: Img[];
  variants: V[];
  colors: { name: string; hex: string }[];
  disabled: boolean;
  children: React.ReactNode;
}) {
  const [color, setColor] = useState(colors[0]?.name ?? "");
  const forColor = images.filter((i) => i.color === color);
  const shown = forColor.length ? forColor : images.filter((i) => !i.color);
  const hex = colors.find((c) => c.name === color)?.hex ?? "#f5f5f5";

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {shown.length ? (
          shown.map((img, i) => (
            <div key={img.mediaId} className={`aspect-[4/5] bg-tile ${i === 0 && shown.length % 2 === 1 ? "sm:col-span-2" : ""}`}>
              <img src={`/media/${img.mediaId}`} alt={`${name}, ${color}`} className="h-full w-full object-cover" loading={i ? "lazy" : "eager"} />
            </div>
          ))
        ) : (
          <div className="aspect-[4/5] bg-tile sm:col-span-2 sm:aspect-[5/4]">
            <TeeArt fit={fit} color={hex} className="h-full w-full p-10" />
          </div>
        )}
      </div>
      <div className="lg:sticky lg:top-24 lg:self-start">
        {children}
        <div className="mt-8">
          <AddToCart variants={variants} colors={colors} disabled={disabled} onColorChange={setColor} />
        </div>
      </div>
    </div>
  );
}
