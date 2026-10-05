"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { addToCart } from "@/app/actions/cart";

type V = { id: string; color: string; colorHex: string; size: string; stock: number };

export function AddToCart({
  variants,
  colors,
  disabled,
  initialColor,
  onColorChange,
}: {
  variants: V[];
  colors: { name: string; hex: string }[];
  disabled?: boolean;
  initialColor?: string;
  onColorChange?: (c: string) => void;
}) {
  const [color, setColor] = useState(initialColor ?? colors[0]?.name ?? "");
  const [size, setSize] = useState<string | null>(null);
  const [state, action, pending] = useActionState(addToCart, null);

  const sizes = useMemo(() => variants.filter((v) => v.color === color), [variants, color]);
  const selected = sizes.find((v) => v.size === size) ?? null;

  return (
    <form action={action} className="grid gap-6">
      <fieldset>
        <legend className="label">
          Color: <span className="font-normal normal-case tracking-normal">{color}</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              title={c.name}
              aria-label={c.name}
              aria-pressed={c.name === color}
              onClick={() => {
                setColor(c.name);
                setSize(null);
                onColorChange?.(c.name);
              }}
              className={`h-9 w-9 border p-0.5 ${c.name === color ? "border-ink" : "border-transparent hover:border-line"}`}
            >
              <span className="block h-full w-full border border-black/10" style={{ background: c.hex }} />
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <div className="flex items-baseline justify-between">
          <legend className="label">Talla</legend>
          <Link href="/ayuda/guia-de-tallas" className="link text-xs">
            Guía de tallas
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {sizes.map((v) => {
            const out = v.stock <= 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={out}
                aria-pressed={v.size === size}
                onClick={() => setSize(v.size)}
                className={`relative h-11 border text-sm font-bold ${
                  v.size === size ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
                } disabled:cursor-not-allowed disabled:text-muted disabled:line-through`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {selected && selected.stock > 0 && selected.stock <= 5 && (
          <p className="mt-2 text-xs font-bold text-sale">Quedan {selected.stock} piezas</p>
        )}
      </fieldset>

      <input type="hidden" name="variantId" value={selected?.id ?? ""} />
      <input type="hidden" name="quantity" value="1" />
      <button type="submit" className="btn w-full" disabled={disabled || pending || !selected}>
        {disabled ? "Disponible pronto" : pending ? "Agregando…" : selected ? "Agregar al carrito" : "Elige una talla"}
      </button>
      {state?.message && (
        <p role="status" className={state.ok ? "text-sm font-bold text-ok" : "error"}>
          {state.message}{" "}
          {state.ok && (
            <Link href="/carrito" className="link text-ink">
              Ver carrito
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
