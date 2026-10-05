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
};

export const DEFAULT_SETTINGS: StoreSettings = {
  announcement: "Envío gratis en pedidos desde $999",
  announcementHref: "/productos",
  shippingFlat: 9900,
  freeShippingFrom: 99900,
  contactEmail: "hola@ban.mx",
  instagram: "",
  tiktok: "",
};

export async function getSettings(): Promise<StoreSettings> {
  const rows = await db.select().from(settings);
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
