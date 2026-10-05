import type { Fit } from "@/db/schema";

/**
 * Ilustración de la prenda mientras no haya fotos reales.
 * Cambia la silueta según el corte y se pinta del color de la variante.
 */
export function TeeArt({ fit, color, className = "" }: { fit: Fit | string; color: string; className?: string }) {
  const light = isLight(color);
  const stroke = light ? "rgba(0,0,0,.18)" : "rgba(255,255,255,.14)";
  const path =
    fit === "oversize"
      ? "M118 46 L160 34 Q200 58 240 34 L282 46 L352 92 L326 156 L292 142 L292 352 L108 352 L108 142 L74 156 L48 92 Z"
      : fit === "boxy"
        ? "M126 50 L166 38 Q200 60 234 38 L274 50 L336 92 L314 146 L284 134 L284 316 L116 316 L116 134 L86 146 L64 92 Z"
        : "M134 52 L170 40 Q200 62 230 40 L266 52 L326 98 L304 148 L272 134 L276 346 L124 346 L128 134 L96 148 L74 98 Z";
  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label={`Playera ${fit}`}>
      <path d={path} fill={color} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      <path
        d={fit === "oversize" ? "M160 34 Q200 70 240 34" : fit === "boxy" ? "M166 38 Q200 72 234 38" : "M170 40 Q200 74 230 40"}
        fill="none"
        stroke={stroke}
        strokeWidth="6"
      />
    </svg>
  );
}

function isLight(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
