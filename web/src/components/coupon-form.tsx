"use client";

import { useActionState } from "react";
import { applyCoupon } from "@/app/actions/cart";

export function CouponForm() {
  const [state, action, pending] = useActionState(applyCoupon, null);
  return (
    <form action={action} className="grid gap-2">
      <label htmlFor="coupon" className="text-xs font-bold uppercase tracking-wider">
        Código de descuento
      </label>
      <div className="flex">
        <input id="coupon" name="code" className="input h-10 flex-1 uppercase" autoComplete="off" />
        <button type="submit" className="btn-outline h-10 px-4 text-xs" disabled={pending}>
          Aplicar
        </button>
      </div>
      {state?.message && <p className={state.ok ? "text-sm text-ok" : "error"}>{state.message}</p>}
    </form>
  );
}
