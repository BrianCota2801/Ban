const fmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const fmt2 = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

/** Centavos → "$549". Muestra centavos solo si los hay. */
export function money(cents: number) {
  return cents % 100 === 0 ? fmt.format(cents / 100) : fmt2.format(cents / 100);
}

/** "549.50" → 54950. Devuelve null si no es un número válido. */
export function parsePesos(v: FormDataEntryValue | null | undefined): number | null {
  if (v == null || String(v).trim() === "") return null;
  const n = Number(String(v).replace(/[$,\s]/g, ""));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export function pesos(cents: number | null | undefined) {
  return cents == null ? "" : (cents / 100).toString();
}
