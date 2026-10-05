// Datos iniciales de ejemplo: 3 playeras Core, 1 drop, la página principal y un cupón.
// Solo se cargan si la base no tiene productos. Edita o borra todo desde el panel.
import "./env";
import { count } from "drizzle-orm";
import { db } from "../src/db";
import { coupons, homeSections, products, settings, variants } from "../src/db/schema";
import { DEFAULT_SETTINGS, saveSettings } from "../src/lib/settings";
import { upsertAdmin } from "./create-admin";

const SIZES = ["S", "M", "L", "XL"];
const BLACK = { name: "Negro", hex: "#111111" };
const WHITE = { name: "Blanco", hex: "#f4f4f2" };

const CATALOG = [
  {
    slug: "playera-oversize-heavyweight",
    name: "Playera Oversize Heavyweight",
    fit: "oversize" as const,
    price: 54900,
    gsm: 250,
    sortOrder: 1,
    description:
      "Nuestra playera insignia. Hombro caído, cuerpo amplio y manga a medio brazo. Tela pesada que cae bien y no se transparenta, con cuello rib reforzado que no se deforma.",
    colors: [BLACK, WHITE, { name: "Gris jaspe", hex: "#9b9b98" }, { name: "Hueso", hex: "#e6dfcf" }],
  },
  {
    slug: "playera-regular-heavyweight",
    name: "Playera Regular Heavyweight",
    fit: "regular" as const,
    price: 49900,
    gsm: 240,
    sortOrder: 2,
    description: "Corte clásico al cuerpo, sin quedar ajustado. La misma tela pesada de la oversize para quien prefiere un fit tradicional.",
    colors: [BLACK, WHITE, { name: "Azul marino", hex: "#1e2536" }],
  },
  {
    slug: "playera-boxy-heavyweight",
    name: "Playera Boxy Heavyweight",
    fit: "boxy" as const,
    price: 54900,
    gsm: 260,
    sortOrder: 3,
    description: "Corte cuadrado y corto, manga amplia. Pensada para usarse con pantalón de tiro alto.",
    colors: [BLACK, WHITE, { name: "Verde olivo", hex: "#585c3c" }],
  },
];

async function main() {
  // Ajustes por defecto solo la primera vez; después se editan desde el panel.
  const [{ s }] = await db.select({ s: count() }).from(settings);
  if (s === 0) await saveSettings(DEFAULT_SETTINGS);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) console.log(`Admin ${email}: ${await upsertAdmin(email, password, "Administrador", true)}.`);
  else console.log("Sin ADMIN_EMAIL/ADMIN_PASSWORD en .env: no se creó administrador.");

  const [{ n }] = await db.select({ n: count() }).from(products);
  if (n > 0) {
    console.log("Ya hay productos; no se cargan datos de ejemplo.");
    return;
  }

  const common = {
    composition: "100 % algodón peinado, hilo compactado",
    madeIn: "México",
    care: "Lavar en frío y al revés. Secar a temperatura baja. No usar cloro.",
    status: "active" as const,
  };

  for (const item of CATALOG) {
    const { colors, ...data } = item;
    const [p] = await db.insert(products).values({ ...data, ...common, collection: "core" }).returning();
    await db.insert(variants).values(
      colors.flatMap((c, ci) =>
        SIZES.map((size, si) => ({
          productId: p.id,
          color: c.name,
          colorHex: c.hex,
          size,
          sku: `BAN-${item.fit.slice(0, 3).toUpperCase()}-${c.name.slice(0, 3).toUpperCase()}${ci}-${size}`,
          stock: 12,
          sortOrder: ci * 10 + si,
        })),
      ),
    );
  }

  const release = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
  const [drop] = await db
    .insert(products)
    .values({
      ...common,
      slug: "drop-01-oversize-cafe",
      name: "Drop 01 · Oversize Café",
      fit: "oversize",
      collection: "drop",
      price: 59900,
      gsm: 250,
      sortOrder: 0,
      releaseAt: release,
      description: "Primer drop de BAN. Color café tostado en nuestra oversize de 250 g/m². Edición limitada, sin resurtido.",
    })
    .returning();
  await db.insert(variants).values(
    SIZES.map((size, i) => ({ productId: drop.id, color: "Café", colorHex: "#5b4636", size, sku: `BAN-D01-CAF-${size}`, stock: 6, sortOrder: i })),
  );

  await db.insert(homeSections).values([
    {
      type: "hero",
      sortOrder: 10,
      data: {
        eyebrow: "Core · Heavyweight 250 g/m²",
        heading: "Básicos que duran",
        subheading: "Playeras pesadas de algodón peinado. Oversize, regular y boxy.",
        ctaLabel: "Comprar playeras",
        ctaHref: "/productos",
        imageId: null,
        background: "#e9e7e2",
        tone: "dark",
        align: "left",
      },
    },
    { type: "promo_strip", sortOrder: 20, data: { text: "10 % en tu primera compra con el código BIENVENIDA", href: "/productos", tone: "black" } },
    {
      type: "fit_tiles",
      sortOrder: 30,
      data: {
        heading: "Compra por corte",
        tiles: [
          { label: "Oversize", href: "/productos?corte=oversize", imageId: null },
          { label: "Regular", href: "/productos?corte=regular", imageId: null },
          { label: "Boxy", href: "/productos?corte=boxy", imageId: null },
        ],
      },
    },
    { type: "product_grid", sortOrder: 40, data: { heading: "Core", mode: "collection", collection: "core", productIds: [], fit: "oversize", limit: 8 } },
    {
      type: "editorial",
      sortOrder: 50,
      data: {
        heading: "Hecha para durar",
        body: "250 g/m² de algodón peinado, cuello reforzado y tela preencogida.\nUna playera que se ve igual después de cincuenta lavadas.",
        ctaLabel: "Cuánto cuesta hacerla",
        ctaHref: "/ayuda/transparencia",
        imageId: null,
        imageSide: "left",
      },
    },
    { type: "product_grid", sortOrder: 60, data: { heading: "Próximo drop", mode: "collection", collection: "drop", productIds: [], fit: "oversize", limit: 4 } },
  ]);

  await db.insert(coupons).values({ code: "BIENVENIDA", kind: "percent", value: 10, minSubtotal: 0 });
  console.log("Datos de ejemplo cargados: 4 productos, página principal y cupón BIENVENIDA.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
