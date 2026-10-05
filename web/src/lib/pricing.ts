import type { Coupon } from "@/db/schema";

export type Totals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  couponError: string | null;
  freeShippingRemaining: number;
};

/** Revisa si un cupón aplica a un subtotal. Devuelve el descuento en centavos o un mensaje de error. */
export function evaluateCoupon(coupon: Coupon | null, subtotal: number, now = new Date()) {
  if (!coupon || !coupon.active) return { discount: 0, error: "Ese código no existe o ya no está activo." };
  if (coupon.startsAt && coupon.startsAt > now) return { discount: 0, error: "Ese código todavía no está vigente." };
  if (coupon.endsAt && coupon.endsAt <= now) return { discount: 0, error: "Ese código ya venció." };
  if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) return { discount: 0, error: "Ese código ya se agotó." };
  if (subtotal < coupon.minSubtotal)
    return { discount: 0, error: `El código aplica desde $${Math.ceil(coupon.minSubtotal / 100)} de compra.` };
  const raw = coupon.kind === "percent" ? Math.round((subtotal * Math.min(coupon.value, 100)) / 100) : coupon.value;
  return { discount: Math.min(raw, subtotal), error: null };
}

export function computeTotals(
  subtotal: number,
  coupon: Coupon | null,
  hasCouponCode: boolean,
  shipping: { flat: number; freeFrom: number },
): Totals {
  const c = hasCouponCode ? evaluateCoupon(coupon, subtotal) : { discount: 0, error: null };
  const afterDiscount = subtotal - c.discount;
  const free = shipping.freeFrom > 0 && afterDiscount >= shipping.freeFrom;
  const ship = subtotal === 0 || free ? 0 : shipping.flat;
  return {
    subtotal,
    discount: c.discount,
    shipping: ship,
    total: afterDiscount + ship,
    couponError: c.error,
    freeShippingRemaining: shipping.freeFrom > 0 && !free ? shipping.freeFrom - afterDiscount : 0,
  };
}
