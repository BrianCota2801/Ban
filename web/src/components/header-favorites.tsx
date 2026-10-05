"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeartIcon } from "./icons";

/** Ícono de favoritos con contador que se actualiza al tocar corazones en la página. */
export function HeaderFavorites({ initial }: { initial: number }) {
  const [n, setN] = useState(initial);
  useEffect(() => setN(initial), [initial]);
  useEffect(() => {
    const on = (e: Event) => setN((v) => Math.max(0, v + ((e as CustomEvent<number>).detail ?? 0)));
    window.addEventListener("ban:favorites", on);
    return () => window.removeEventListener("ban:favorites", on);
  }, []);
  return (
    <Link href="/favoritos" aria-label={`Favoritos, ${n}`} className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-tile">
      <HeartIcon />
      {n > 0 && (
        <span className="absolute right-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-sale px-1 text-[10px] font-bold text-white">{n}</span>
      )}
    </Link>
  );
}
