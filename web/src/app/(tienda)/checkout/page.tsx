import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { getCurrentUser } from "@/lib/auth";
import { loadCart } from "@/lib/cart";
import { money } from "@/lib/money";
import { stripeEnabled } from "@/lib/payments";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const [cart, user] = await Promise.all([loadCart(), getCurrentUser()]);
  if (!cart.lines.length || cart.lines.some((l) => !l.purchasable)) redirect("/carrito");
  const stripe = stripeEnabled();

  return (
    <div className="container-x py-8 md:py-12">
      <h1 className="text-3xl font-black uppercase tracking-tight">Finalizar compra</h1>
      {!user && (
        <p className="mt-3 text-sm text-muted">
          ¿Tienes cuenta? <Link href="/login?next=/checkout" className="link text-ink">Inicia sesión</Link> para guardar el pedido en tu historial.
        </p>
      )}
      <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_400px]">
        <div className="max-w-2xl">
          <CheckoutForm
            email={user?.email ?? ""}
            name={user?.name ?? ""}
            payLabel={stripe ? `Pagar ${money(cart.totals.total)}` : `Confirmar pedido · ${money(cart.totals.total)}`}
          />
          <p className="mt-4 text-xs text-muted">
            {stripe
              ? "Te llevaremos a la página segura de pago. Aceptamos tarjeta de crédito, débito y pago en OXXO."
              : "Modo demostración: los pagos en línea aún no están conectados."}
          </p>
        </div>
        <aside className="h-fit bg-tile p-6 lg:sticky lg:top-24">
          <h2 className="label">Tu pedido</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {cart.lines.map((l) => (
              <li key={l.itemId} className="flex justify-between gap-4">
                <span>
                  {l.productName} <span className="text-muted">· {l.color} · {l.size} × {l.quantity}</span>
                </span>
                <span className="shrink-0">{money(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 grid gap-2 border-t border-black/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{money(cart.totals.subtotal)}</dd></div>
            {cart.totals.discount > 0 && (
              <div className="flex justify-between"><dt className="text-muted">Descuento</dt><dd className="text-sale">−{money(cart.totals.discount)}</dd></div>
            )}
            <div className="flex justify-between"><dt className="text-muted">Envío</dt><dd>{cart.totals.shipping ? money(cart.totals.shipping) : "Gratis"}</dd></div>
            <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-lg font-bold"><dt>Total</dt><dd>{money(cart.totals.total)}</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
