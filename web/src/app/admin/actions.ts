"use server";

import { and, asc, count, eq, gt, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  coupons,
  FITS,
  orderItems,
  orders,
  homeSections,
  ORDER_STATUSES,
  productImages,
  products,
  SECTION_TYPES,
  variants,
  type HomeSection,
} from "@/db/schema";
import { audit, requireAdmin } from "@/lib/auth";
import { parseLocalDateTime } from "@/lib/dates";
import { fieldErrors, str, type FormState } from "@/lib/forms";
import { SECTION_DEFAULTS, sectionData } from "@/lib/home";
import { saveImage, UploadError } from "@/lib/media";
import { parsePesos } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { cancelOrder } from "@/lib/orders";
import { saveSettings } from "@/lib/settings";

function refreshStore() {
  revalidatePath("/", "layout");
}

/** Acepta rutas internas ("/productos") o enlaces https. Cualquier otra cosa se descarta. */
function safeHref(v: string) {
  return v.startsWith("/") && !v.startsWith("//") ? v : /^https:\/\/[^\s]+$/.test(v) ? v : "";
}

function hex(v: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
}

/** Imagen de un formulario: nueva subida, quitar la actual o conservarla. */
async function imageField(fd: FormData, name: string, current: string | null) {
  if (fd.get(`${name}Remove`) === "on") return null;
  return (await saveImage(fd.get(name))) ?? current;
}

// ─── Página principal ───────────────────────────────────────────────────────

export async function createSection(fd: FormData) {
  const admin = await requireAdmin();
  const type = z.enum(SECTION_TYPES).parse(fd.get("type"));
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${homeSections.sortOrder}), 0)` }).from(homeSections);
  const [s] = await db
    .insert(homeSections)
    .values({ type, data: SECTION_DEFAULTS[type], visible: false, sortOrder: Number(max) + 10 })
    .returning();
  await audit(admin.id, "home.section_created", { id: s.id, type });
  redirect(`/admin/inicio/${s.id}`);
}

export async function saveSection(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const [s] = await db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1);
  if (!s) return { ok: false, message: "La sección ya no existe." };

  try {
    const data = await readSectionData(s, fd);
    const startsAt = parseLocalDateTime(fd.get("startsAt"));
    const endsAt = parseLocalDateTime(fd.get("endsAt"));
    if (startsAt && endsAt && endsAt <= startsAt) return { ok: false, message: "La fecha de fin debe ser después del inicio." };
    await db
      .update(homeSections)
      .set({ data, title: str(fd, "title").slice(0, 120), visible: fd.get("visible") === "on", startsAt, endsAt, updatedAt: new Date() })
      .where(eq(homeSections.id, id));
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, message: e.message };
    throw e;
  }
  await audit(admin.id, "home.section_saved", { id });
  refreshStore();
  revalidatePath("/admin/inicio");
  return { ok: true, message: "Guardado. Los cambios ya están en la página." };
}

async function readSectionData(s: HomeSection, fd: FormData): Promise<Record<string, unknown>> {
  const t = (k: string, max = 300) => str(fd, k).slice(0, max);
  switch (s.type) {
    case "hero": {
      const cur = sectionData<{ imageId: string | null }>(s);
      return {
        eyebrow: t("eyebrow", 60),
        heading: t("heading", 120),
        subheading: t("subheading", 240),
        ctaLabel: t("ctaLabel", 40),
        ctaHref: safeHref(t("ctaHref")),
        background: hex(t("background"), "#e9e7e2"),
        tone: fd.get("tone") === "light" ? "light" : "dark",
        align: fd.get("align") === "center" ? "center" : "left",
        imageId: await imageField(fd, "image", cur.imageId),
      };
    }
    case "promo_strip":
      return {
        text: t("text", 160),
        href: safeHref(t("href")),
        tone: z.enum(["black", "red", "gray"]).catch("black").parse(fd.get("tone")),
      };
    case "product_grid":
      return {
        heading: t("heading", 80),
        mode: z.enum(["all", "manual", "collection", "fit"]).catch("all").parse(fd.get("mode")),
        productIds: fd.getAll("productIds").map(String).filter((v) => /^[0-9a-f-]{36}$/i.test(v)),
        collection: fd.get("collection") === "drop" ? "drop" : "core",
        fit: z.enum(FITS).catch("oversize").parse(fd.get("fit")),
        limit: Math.min(24, Math.max(1, Number(fd.get("limit")) || 8)),
      };
    case "fit_tiles": {
      const cur = sectionData<{ tiles: { imageId: string | null }[] }>(s);
      const tiles = [];
      for (let i = 0; i < 4; i++) {
        const label = t(`tile${i}Label`, 40);
        if (!label) continue;
        tiles.push({
          label,
          href: safeHref(t(`tile${i}Href`)) || "/productos",
          imageId: await imageField(fd, `tile${i}Image`, cur.tiles[i]?.imageId ?? null),
        });
      }
      return { heading: t("heading", 80), tiles };
    }
    case "editorial": {
      const cur = sectionData<{ imageId: string | null }>(s);
      return {
        heading: t("heading", 120),
        body: t("body", 1200),
        ctaLabel: t("ctaLabel", 40),
        ctaHref: safeHref(t("ctaHref")),
        imageSide: fd.get("imageSide") === "left" ? "left" : "right",
        imageId: await imageField(fd, "image", cur.imageId),
      };
    }
  }
}

export async function moveSection(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const dir = fd.get("dir") === "up" ? "up" : "down";
  const [s] = await db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1);
  if (!s) return;
  const [other] = await db
    .select()
    .from(homeSections)
    .where(dir === "up" ? lt(homeSections.sortOrder, s.sortOrder) : gt(homeSections.sortOrder, s.sortOrder))
    .orderBy(dir === "up" ? sql`${homeSections.sortOrder} desc` : asc(homeSections.sortOrder))
    .limit(1);
  if (!other) return;
  await db.update(homeSections).set({ sortOrder: other.sortOrder }).where(eq(homeSections.id, s.id));
  await db.update(homeSections).set({ sortOrder: s.sortOrder }).where(eq(homeSections.id, other.id));
  refreshStore();
}

export async function toggleSection(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await db.update(homeSections).set({ visible: sql`not ${homeSections.visible}` }).where(eq(homeSections.id, id));
  refreshStore();
}

export async function deleteSection(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  await db.delete(homeSections).where(eq(homeSections.id, id));
  await audit(admin.id, "home.section_deleted", { id });
  refreshStore();
  redirect("/admin/inicio");
}

// ─── Productos ──────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre.").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones. Ej: playera-oversize-negra"),
  description: z.string().max(4000),
  fit: z.enum(FITS),
  collection: z.enum(["core", "drop"]),
  status: z.enum(["draft", "active", "archived"]),
  price: z.number({ message: "Escribe el precio." }).int().min(100, "Escribe el precio."),
  compareAtPrice: z.number().int().nullable(),
  gsm: z.number().int().min(80).max(600).nullable(),
  composition: z.string().max(200),
  madeIn: z.string().max(80),
  care: z.string().max(300),
  sortOrder: z.number().int(),
  releaseAt: z.date().nullable(),
});


export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const parsed = productSchema.safeParse({
    name: str(fd, "name"),
    slug: str(fd, "slug") || slugify(str(fd, "name")),
    description: str(fd, "description"),
    fit: fd.get("fit"),
    collection: fd.get("collection"),
    status: fd.get("status"),
    price: parsePesos(fd.get("price")),
    compareAtPrice: parsePesos(fd.get("compareAtPrice")),
    gsm: str(fd, "gsm") ? Number(str(fd, "gsm")) : null,
    composition: str(fd, "composition"),
    madeIn: str(fd, "madeIn"),
    care: str(fd, "care"),
    sortOrder: Number(str(fd, "sortOrder") || 0),
    releaseAt: parseLocalDateTime(fd.get("releaseAt")),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error.issues), message: "Revisa los campos marcados." };

  const [clash] = await db.select({ id: products.id }).from(products).where(eq(products.slug, parsed.data.slug)).limit(1);
  if (clash && clash.id !== id) return { ok: false, errors: { slug: "Ya hay otro producto con esa dirección." } };

  if (id) {
    await db.update(products).set({ ...parsed.data, updatedAt: new Date() }).where(eq(products.id, id));
    await audit(admin.id, "product.updated", { id });
  } else {
    const [p] = await db.insert(products).values(parsed.data).returning({ id: products.id });
    await audit(admin.id, "product.created", { id: p.id });
    refreshStore();
    redirect(`/admin/productos/${p.id}?nuevo=1`);
  }
  refreshStore();
  return { ok: true, message: "Producto guardado." };
}

export async function deleteProduct(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  // Si ya tiene ventas, se archiva para conservar el historial; si no, se borra.
  const [{ sold }] = await db
    .select({ sold: count() })
    .from(orderItems)
    .innerJoin(variants, eq(variants.id, orderItems.variantId))
    .where(eq(variants.productId, id));
  if (sold > 0) await db.update(products).set({ status: "archived" }).where(eq(products.id, id));
  else await db.delete(products).where(eq(products.id, id));
  await audit(admin.id, sold > 0 ? "product.archived" : "product.deleted", { id });
  refreshStore();
  redirect("/admin/productos");
}

export async function addVariants(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const productId = str(fd, "productId");
  const color = str(fd, "color").slice(0, 40);
  const sizes = fd.getAll("sizes").map(String);
  const stock = Math.max(0, Math.floor(Number(fd.get("stock")) || 0));
  if (!color) return { ok: false, message: "Escribe el nombre del color." };
  if (!sizes.length) return { ok: false, message: "Elige al menos una talla." };
  const [p] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!p) return { ok: false, message: "El producto no existe." };

  const base = `BAN-${slugify(p.slug).slice(0, 18)}-${slugify(color).slice(0, 10)}`.toUpperCase();
  const existing = await db.select().from(variants).where(eq(variants.productId, productId));
  const values = sizes
    .filter((size) => !existing.some((v) => v.color === color && v.size === size))
    .map((size, i) => ({
      productId,
      color,
      colorHex: hex(str(fd, "colorHex"), "#111111"),
      size,
      stock,
      sku: `${base}-${size}`,
      sortOrder: existing.length + i,
    }));
  if (!values.length) return { ok: false, message: "Esas tallas ya existen para ese color." };
  try {
    await db.insert(variants).values(values);
  } catch {
    return { ok: false, message: "Algún SKU ya existe en otro producto. Cambia el nombre del color." };
  }
  await audit(admin.id, "variants.added", { productId, color, sizes });
  refreshStore();
  return { ok: true, message: `Agregadas ${values.length} tallas en ${color}.` };
}

export async function updateStock(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const stock = Math.max(0, Math.floor(Number(fd.get("stock")) || 0));
  await db.update(variants).set({ stock }).where(eq(variants.id, id));
  await audit(admin.id, "variant.stock", { id, stock });
  refreshStore();
}

export async function deleteVariant(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  await db.delete(variants).where(eq(variants.id, id));
  await audit(admin.id, "variant.deleted", { id });
  refreshStore();
}

export async function addProductImages(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const productId = str(fd, "productId");
  const color = str(fd, "color") || null;
  const files = fd.getAll("images");
  if (!files.some((f) => f instanceof File && f.size > 0)) return { ok: false, message: "Elige una o más fotos." };
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${productImages.sortOrder}), 0)` })
    .from(productImages)
    .where(eq(productImages.productId, productId));
  let n = 0;
  try {
    for (const f of files) {
      const mediaId = await saveImage(f);
      if (mediaId) await db.insert(productImages).values({ productId, mediaId, color, sortOrder: Number(max) + ++n });
    }
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, message: e.message };
    throw e;
  }
  refreshStore();
  return { ok: true, message: n === 1 ? "Foto agregada." : `${n} fotos agregadas.` };
}

export async function deleteProductImage(fd: FormData) {
  await requireAdmin();
  await db.delete(productImages).where(eq(productImages.id, Number(fd.get("id"))));
  refreshStore();
}

// ─── Pedidos ────────────────────────────────────────────────────────────────

export async function updateOrder(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const status = z.enum(ORDER_STATUSES).safeParse(fd.get("status"));
  if (!status.success) return { ok: false, message: "Estado no válido." };
  if (status.data === "cancelled") {
    await cancelOrder(id);
  } else {
    await db
      .update(orders)
      .set({
        status: status.data,
        carrier: str(fd, "carrier").slice(0, 60) || null,
        trackingNumber: str(fd, "trackingNumber").slice(0, 80) || null,
        ...(status.data === "paid" ? { paidAt: new Date() } : {}),
      })
      .where(and(eq(orders.id, id), sql`${orders.status} <> 'cancelled'`));
  }
  await audit(admin.id, "order.updated", { id, status: status.data });
  revalidatePath(`/admin/pedidos/${id}`);
  return { ok: true, message: "Pedido actualizado." };
}

// ─── Promociones ────────────────────────────────────────────────────────────

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,30}$/, "Usa de 3 a 30 letras, números o guiones."),
  kind: z.enum(["percent", "fixed"]),
  value: z.number().int().positive("Escribe el valor."),
  minSubtotal: z.number().int().min(0),
  maxUses: z.number().int().positive().nullable(),
  startsAt: z.date().nullable(),
  endsAt: z.date().nullable(),
});

export async function saveCoupon(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const kind = fd.get("kind") === "fixed" ? "fixed" : "percent";
  const rawValue = Number(str(fd, "value"));
  const parsed = couponSchema.safeParse({
    code: str(fd, "code"),
    kind,
    value: kind === "fixed" ? parsePesos(fd.get("value")) : Number.isFinite(rawValue) ? Math.round(rawValue) : NaN,
    minSubtotal: parsePesos(fd.get("minSubtotal")) ?? 0,
    maxUses: str(fd, "maxUses") ? Number(str(fd, "maxUses")) : null,
    startsAt: parseLocalDateTime(fd.get("startsAt")),
    endsAt: parseLocalDateTime(fd.get("endsAt")),
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error.issues), message: "Revisa los campos marcados." };
  if (parsed.data.kind === "percent" && parsed.data.value > 90) return { ok: false, errors: { value: "Máximo 90 %." } };
  try {
    await db.insert(coupons).values(parsed.data);
  } catch {
    return { ok: false, errors: { code: "Ya existe un código igual." } };
  }
  await audit(admin.id, "coupon.created", { code: parsed.data.code });
  revalidatePath("/admin/promociones");
  return { ok: true, message: `Código ${parsed.data.code} creado.` };
}

export async function toggleCoupon(fd: FormData) {
  await requireAdmin();
  await db.update(coupons).set({ active: sql`not ${coupons.active}` }).where(eq(coupons.id, str(fd, "id")));
  revalidatePath("/admin/promociones");
}

export async function deleteCoupon(fd: FormData) {
  const admin = await requireAdmin();
  await db.delete(coupons).where(eq(coupons.id, str(fd, "id")));
  await audit(admin.id, "coupon.deleted", { id: str(fd, "id") });
  revalidatePath("/admin/promociones");
}

// ─── Ajustes ────────────────────────────────────────────────────────────────

export async function saveStoreSettings(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const flat = parsePesos(fd.get("shippingFlat"));
  const free = parsePesos(fd.get("freeShippingFrom"));
  if (flat == null || free == null) return { ok: false, message: "Escribe los montos de envío (0 si no aplica)." };
  const email = str(fd, "contactEmail");
  if (email && !z.string().email().safeParse(email).success) return { ok: false, message: "El correo de contacto no es válido." };
  await saveSettings({
    announcement: str(fd, "announcement").slice(0, 140),
    announcementHref: safeHref(str(fd, "announcementHref")),
    shippingFlat: flat,
    freeShippingFrom: free,
    contactEmail: email,
    instagram: /^https:\/\//.test(str(fd, "instagram")) ? str(fd, "instagram") : "",
    tiktok: /^https:\/\//.test(str(fd, "tiktok")) ? str(fd, "tiktok") : "",
  });
  await audit(admin.id, "settings.saved");
  refreshStore();
  return { ok: true, message: "Ajustes guardados." };
}
