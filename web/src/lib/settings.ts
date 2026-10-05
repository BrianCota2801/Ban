import "server-only";
import { db } from "@/db";
import { settings } from "@/db/schema";

export type StoreSettings = {
  announcement: string;
  announcementHref: string;
  shippingFlat: number; // centavos
  freeShippingFrom: number; // centavos; 0 = nunca gratis
  contactEmail: string;
  instagram: string;
  tiktok: string;
  corners: "round" | "soft" | "square";
  brandColor: string;
};

export const CORNERS = {
  round: { btn: "999px", input: "14px", card: "18px", tag: "999px" },
  soft: { btn: "8px", input: "8px", card: "8px", tag: "4px" },
  square: { btn: "0px", input: "0px", card: "0px", tag: "0px" },
} as const;

/** Variables CSS del tema elegido en Ajustes. */
export function themeVars(s: Pick<StoreSettings, "corners" | "brandColor">) {
  const c = CORNERS[s.corners] ?? CORNERS.round;
  return {
    "--r-btn": c.btn,
    "--r-input": c.input,
    "--r-card": c.card,
    "--r-tag": c.tag,
    "--color-brand": /^#[0-9a-f]{6}$/i.test(s.brandColor) ? s.brandColor : "#111111",
  } as React.CSSProperties;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "Envío gratis en pedidos desde $999",
  announcementHref: "/productos",
  shippingFlat: 9900,
  freeShippingFrom: 99900,
  contactEmail: "hola@ban.mx",
  instagram: "",
  tiktok: "",
  corners: "round",
  brandColor: "#111111",
};

export async function getSettings(): Promise<StoreSettings> {
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await db.select().from(settings);
  } catch (e) {
    // Sin base disponible (p. ej. al compilar) se usan los valores por defecto.
    if (process.env.NEXT_PHASE !== "phase-production-build") console.error("No se pudieron leer los ajustes:", e);
  }
  const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
  for (const r of rows) if (r.key in out) out[r.key] = r.value;
  return out as StoreSettings;
}

export async function saveSettings(values: Partial<StoreSettings>) {
  for (const [key, value] of Object.entries(values)) {
    await db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value } });
  }
}
