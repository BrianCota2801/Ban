"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/app/actions/favorites";
import { HeartIcon } from "./icons";

export function FavoriteButton({ productId, initial, size = "md", label }: { productId: string; initial: boolean; size?: "md" | "lg"; label?: string }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? "Quitar de favoritos" : "Agregar a favoritos"}
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const next = !on;
        setOn(next);
        start(async () => {
          const res = await toggleFavorite(productId);
          if (res === null) setOn(!next);
          else setOn(res);
          window.dispatchEvent(new CustomEvent("ban:favorites", { detail: res === null ? 0 : res ? 1 : -1 }));
        });
      }}
      className={
        size === "lg"
          ? "btn-outline h-12 w-full gap-2 sm:w-auto"
          : "grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-tile"
      }
    >
      <HeartIcon filled={on} className={`${size === "lg" ? "h-5 w-5" : "h-[22px] w-[22px]"} ${on ? "text-sale" : ""}`} />
      {label && <span>{on ? "En favoritos" : label}</span>}
    </button>
  );
}
