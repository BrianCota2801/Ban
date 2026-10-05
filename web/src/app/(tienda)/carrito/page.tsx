import type { Metadata } from "next";
import Link from "next/link";
import { removeCartItem, removeCoupon, updateCartItem } from "@/app/actions/cart";
import { CouponForm } from "@/components/coupon-form";
import { TeeArt } from "@/components/tee-art";
import { loadCart, MAX_QTY } from "@/lib/cart";
import { money } from "@/lib/money";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default async function CartPage() {
  const cart = await loadCart();
  const blocked = cart.lines.some((l) => !l.purchasable);

  if (!cart.lines.length) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="h-section">Tu carrito está vacío</h1>
        <Link href="/productos" className="btn mt-8">
          Ver playeras
        </Link>
      </div>
    );
  }

  return (
    <div className="container-x py-8 md:py-12">
      <h1 className="text-3xl font-black uppercase tracking-tight">Carrito ({cart.count})</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y divide-line border-y border-line">
          {cart.lines.map((l) => (
            <li key={l.itemId} className="grid grid-cols-[96px_1fr] gap-4 py-5 sm:grid-cols-[120px_1fr_auto]">
              <Link href={`/productos/${l.slug}`} className="aspect-[4/5] bg-tile">
                {l.imageId ? (
                  <img src={`/media/${l.imageId}`} alt="" className="h-full w-full object-cover" />
                ) : (
                  <TeeArt fit={l.fit} color={l.colorHex} className="h-full w-full p-3" />
                )}
              </Link>
              <div className="min-w-0">
                <Link href={`/productos/${l.slug}`} className="font-bold hover:underline">
                  {l.productName}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {l.color} · Talla {l.size}
                </p>
                <p className="mt-1 text-sm">{money(l.unitPrice)}</p>
                {!l.purchasable && (
                  <p className="mt-2 text-sm font-bold text-sale">
                    {l.stock <= 0 ? "Se agotó. Quítalo para continuar." : l.stock < l.quantity ? `Solo quedan ${l.stock}. Ajusta la cantidad.` : "Ya no está disponible."}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4">
                  <form action={updateCartItem} className="flex items-center gap-2">
                    <input type="hidden" name="itemId" value={l.itemId} />
                    <label htmlFor={`q-${l.itemId}`} className="sr-only">
                      Cantidad
                    </label>
                    <select id={`q-${l.itemId}`} name="quantity" defaultValue={l.quantity} className="input h-9 w-20">
                      {Array.from({ length: Math.max(MAX_QTY, l.quantity) + 1 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "Quitar" : i}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs underline underline-offset-4">
                      Actualizar
                    </button>
                  </form>
                  <form action={removeCartItem}>
                    <input type="hidden" name="itemId" value={l.itemId} />
                    <button type="submit" className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
              <p className="hidden text-right font-bold sm:block">{money(l.unitPrice * l.quantity)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-line p-6 lg:sticky lg:top-24">
          <h2 className="label">Resumen</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <Row k="Subtotal" v={money(cart.totals.subtotal)} />
            {cart.totals.discount > 0 && <Row k={`Descuento (${cart.couponCode})`} v={`−${money(cart.totals.discount)}`} accent />}
            <Row k="Envío" v={cart.totals.shipping === 0 ? "Gratis" : money(cart.totals.shipping)} />
          </dl>
          {cart.totals.freeShippingRemaining > 0 && (
            <p className="mt-3 bg-tile p-3 text-xs">
              Te faltan <b>{money(cart.totals.freeShippingRemaining)}</b> para el envío gratis.
            </p>
          )}
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{money(cart.totals.total)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">IVA incluido.</p>

          <div className="mt-6">
            {cart.couponCode && !cart.totals.couponError ? (
              <form action={removeCoupon} className="flex items-center justify-between text-sm">
                <span>
                  Código <b>{cart.couponCode}</b> aplicado
                </span>
                <button type="submit" className="text-xs underline underline-offset-4">
                  Quitar
                </button>
              </form>
            ) : (
              <>
                {cart.couponCode && cart.totals.couponError && <p className="error mb-2">{cart.totals.couponError}</p>}
                <CouponForm />
              </>
            )}
          </div>

          {blocked ? (
            <button className="btn mt-6 w-full" disabled>
              Revisa tu carrito
            </button>
          ) : (
            <Link href="/checkout" className="btn mt-6 w-full">
              Continuar con la compra
            </Link>
          )}
          <Link href="/productos" className="mt-4 block text-center text-sm underline underline-offset-4">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted">{k}</dt>
      <dd className={accent ? "font-bold text-sale" : ""}>{v}</dd>
    </div>
  );
}
