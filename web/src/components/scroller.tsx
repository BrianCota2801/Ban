"use client";

import { Children, useRef } from "react";
import { ArrowIcon } from "./icons";

const ITEM_WIDTH: Record<number, string> = {
  2: "w-[78%] sm:w-[calc((100%-1.25rem)/2)]",
  3: "w-[70%] sm:w-[45%] lg:w-[calc((100%-2.5rem)/3)]",
  4: "w-[70%] sm:w-[40%] lg:w-[calc((100%-3.75rem)/4)]",
  5: "w-[62%] sm:w-[36%] lg:w-[calc((100%-5rem)/5)]",
};

/** Fila deslizable con flechas; en celular se desliza con el dedo. */
export function Scroller({ children, columns = 4 }: { children: React.ReactNode; columns?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 md:mx-0 md:px-0">
        {Children.map(children, (c) => (
          <div className={`shrink-0 snap-start ${ITEM_WIDTH[columns] ?? ITEM_WIDTH[4]}`}>{c}</div>
        ))}
      </div>
      <button type="button" aria-label="Anterior" onClick={() => move(-1)} className="absolute -left-3 top-[38%] hidden h-11 w-11 place-items-center rounded-full border border-line bg-white shadow-md hover:bg-tile md:grid">
        <ArrowIcon dir="left" />
      </button>
      <button type="button" aria-label="Siguiente" onClick={() => move(1)} className="absolute -right-3 top-[38%] hidden h-11 w-11 place-items-center rounded-full border border-line bg-white shadow-md hover:bg-tile md:grid">
        <ArrowIcon />
      </button>
    </div>
  );
}
