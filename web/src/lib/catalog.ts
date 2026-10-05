import "server-only";
import { and, asc, eq, ilike, inArray, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { productImages, products, variants, type Fit, type Product, type Variant } from "@/db/schema";
import { mediaSrc } from "./media-url";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
export const FIT_LABEL: Record<Fit, string> = { oversize: "Oversize", regular: "Regular", boxy: "Boxy" };

export type ColorOption = { name: string; hex: string };

export type ProductCard = Pick<
  Product,
  "id" | "slug" | "name" | "fit" | "collection" | "price" | "compareAtPrice" | "gsm" | "releaseAt"
> & {
  colors: ColorOption[];
  image: string | null;
  soldOut: boolean;
  upcoming: boolean;
};

export type ProductDetail = Product & {
  variants: Variant[];
  images: { src: string; color: string | null }[];
  colors: ColorOption[];
  upcoming: boolean;
};

/** Foto de producto guardada en la base (mediaId) o como enlace (url). */
export function imageSrc(i: { mediaId: string | null; url: string | null } | undefined): string | null {
  if (!i) return null;
  return mediaSrc(i.url) ?? mediaSrc(i.mediaId);
}

export function uniqueColors(vs: Pick<Variant, "color" | "colorHex">[]): ColorOption[] {
  const seen = new Map<string, string>();
  for (const v of vs) if (!seen.has(v.color)) seen.set(v.color, v.colorHex);
  return [...seen].map(([name, hex]) => ({ name, hex }));
}

export function sortBySize<T extends { size: string }>(list: T[]) {
  const i = (s: string) => (SIZES.indexOf(s) === -1 ? 99 : SIZES.indexOf(s));
  return [...list].sort((a, b) => i(a.size) - i(b.size));
}

async function attach(rows: Product[]): Promise<ProductCard[]> {
  if (!rows.length) return [];
  const ids = rows.map((p) => p.id);
  const vs = await db.select().from(variants).where(inArray(variants.productId, ids)).orderBy(asc(variants.sortOrder));
  const imgs = await db
    .select()
    .from(productImages)
    .where(inArray(productImages.productId, ids))
    .orderBy(asc(productImages.sortOrder));
  const now = Date.now();
  return rows.map((p) => {
    const pv = vs.filter((v) => v.productId === p.id);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      fit: p.fit,
      collection: p.collection,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      gsm: p.gsm,
      releaseAt: p.releaseAt,
      colors: uniqueColors(pv),
      image: imageSrc(imgs.find((i) => i.productId === p.id)),
      soldOut: pv.length > 0 && pv.every((v) => v.stock <= 0),
      upcoming: !!p.releaseAt && p.releaseAt.getTime() > now,
    };
  });
}

export async function listProducts(filter: { fit?: Fit; collection?: "core" | "drop"; ids?: string[] } = {}) {
  const where: SQL[] = [eq(products.status, "active")];
  if (filter.fit) where.push(eq(products.fit, filter.fit));
  if (filter.collection) where.push(eq(products.collection, filter.collection));
  if (filter.ids) {
    if (!filter.ids.length) return [];
    where.push(inArray(products.id, filter.ids));
  }
  const rows = await db
    .select()
    .from(products)
    .where(and(...where))
    .orderBy(asc(products.sortOrder), asc(products.createdAt));
  const cards = await attach(rows);
  // Respeta el orden elegido en el panel cuando se piden productos concretos.
  if (filter.ids) return filter.ids.map((id) => cards.find((c) => c.id === id)).filter((c): c is ProductCard => !!c);
  return cards;
}

export async function getProductBySlug(slug: string, includeDrafts = false): Promise<ProductDetail | null> {
  const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!p || (!includeDrafts && p.status !== "active")) return null;
  const vs = sortBySize(
    await db.select().from(variants).where(eq(variants.productId, p.id)).orderBy(asc(variants.sortOrder)),
  );
  const imgs = (
    await db.select().from(productImages).where(eq(productImages.productId, p.id)).orderBy(asc(productImages.sortOrder))
  ).flatMap((i) => {
    const src = imageSrc(i);
    return src ? [{ src, color: i.color }] : [];
  });
  return {
    ...p,
    variants: vs,
    images: imgs,
    colors: uniqueColors(vs),
    upcoming: !!p.releaseAt && p.releaseAt.getTime() > Date.now(),
  };
}

export async function searchProducts(q: string) {
  const term = q.trim().slice(0, 60);
  if (term.length < 2) return [];
  const pattern = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db
    .select()
    .from(products)
    .where(and(eq(products.status, "active"), or(ilike(products.name, pattern), ilike(products.description, pattern), ilike(products.composition, pattern))))
    .orderBy(asc(products.sortOrder))
    .limit(48);
  return attach(rows);
}

export async function listProductsByIds(ids: string[]) {
  return listProducts({ ids });
}
