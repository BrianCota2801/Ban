"use client";

type Props = {
  colors: { name: string; hex: string }[];
  selected: string;
  onSelect: (name: string) => void;
  size?: "sm" | "lg";
  hoverSelects?: boolean;
  max?: number;
};

/** Círculos de color: el elegido lleva un aro negro y una palomita para que siempre se note. */
export function ColorSwatches({ colors, selected, onSelect, size = "sm", hoverSelects = false, max }: Props) {
  const list = max ? colors.slice(0, max) : colors;
  const dot = size === "lg" ? "h-9 w-9" : "h-[18px] w-[18px]";
  const box = size === "lg" ? "h-12 w-12" : "h-7 w-7";
  return (
    <div className={`flex flex-wrap items-center ${size === "lg" ? "gap-2" : "gap-0.5"}`} role="radiogroup" aria-label="Color">
      {list.map((c) => {
        const on = c.name === selected;
        return (
          <button
            key={c.name}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={c.name}
            title={c.name}
            onClick={(e) => {
              e.preventDefault();
              onSelect(c.name);
            }}
            onMouseEnter={hoverSelects ? () => onSelect(c.name) : undefined}
            className={`grid ${box} shrink-0 place-items-center rounded-full transition-shadow ${
              on ? "ring-2 ring-ink" : "ring-1 ring-transparent hover:ring-line"
            }`}
          >
            <span className={`relative grid ${dot} place-items-center rounded-full border border-black/15`} style={{ background: c.hex }}>
              {on && size === "lg" && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" fill="none" stroke={isLight(c.hex) ? "#111" : "#fff"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12 5 5 9-10" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
      {max && colors.length > max && <span className="ml-1 text-[11px] text-muted">+{colors.length - max}</span>}
    </div>
  );
}

function isLight(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) > 150;
}
