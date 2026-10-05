import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { homeSections, type Fit, type HomeSection, type SectionType } from "@/db/schema";

export type HeroData = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  imageId: string | null;
  background: string;
  tone: "light" | "dark";
  align: "left" | "center";
};
export type PromoStripData = { text: string; href: string; tone: "black" | "red" | "gray" };
export type ProductGridData = {
  heading: string;
  mode: "all" | "manual" | "collection" | "fit";
  productIds: string[];
  collection: "core" | "drop";
  fit: Fit;
  limit: number;
};
export type FitTilesData = { heading: string; tiles: { label: string; href: string; imageId: string | null }[] };
export type EditorialData = {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageId: string | null;
  imageSide: "left" | "right";
};

export const SECTION_LABEL: Record<SectionType, string> = {
  hero: "Banner principal",
  promo_strip: "Franja de promoción",
  product_grid: "Rejilla de productos",
  fit_tiles: "Accesos por corte",
  editorial: "Bloque de texto e imagen",
};

export const SECTION_HELP: Record<SectionType, string> = {
  hero: "Imagen grande con título y botón. Ideal para lanzamientos y drops.",
  promo_strip: "Una línea de texto destacada, por ejemplo un cupón o envío gratis.",
  product_grid: "Muestra productos: todos, una colección, un corte o los que elijas.",
  fit_tiles: "Tarjetas grandes para entrar por corte: Oversize, Regular, Boxy.",
  editorial: "Texto con imagen para contar la historia de la marca o de una colaboración.",
};

export const SECTION_DEFAULTS: { [K in SectionType]: Record<string, unknown> } = {
  hero: {
    eyebrow: "Nuevo",
    heading: "Título del banner",
    subheading: "",
    ctaLabel: "Comprar",
    ctaHref: "/productos",
    imageId: null,
    background: "#e9e7e2",
    tone: "dark",
    align: "left",
  } satisfies HeroData,
  promo_strip: { text: "Texto de la promoción", href: "/productos", tone: "black" } satisfies PromoStripData,
  product_grid: {
    heading: "Productos",
    mode: "all",
    productIds: [],
    collection: "core",
    fit: "oversize",
    limit: 8,
  } satisfies ProductGridData,
  fit_tiles: {
    heading: "Compra por corte",
    tiles: [
      { label: "Oversize", href: "/productos?corte=oversize", imageId: null },
      { label: "Regular", href: "/productos?corte=regular", imageId: null },
      { label: "Boxy", href: "/productos?corte=boxy", imageId: null },
    ],
  } satisfies FitTilesData,
  editorial: {
    heading: "Título",
    body: "Texto",
    ctaLabel: "",
    ctaHref: "",
    imageId: null,
    imageSide: "right",
  } satisfies EditorialData,
};

export function sectionData<T>(s: HomeSection): T {
  return { ...SECTION_DEFAULTS[s.type], ...(s.data ?? {}) } as T;
}

export function isLive(s: HomeSection, now = new Date()) {
  return s.visible && (!s.startsAt || s.startsAt <= now) && (!s.endsAt || s.endsAt > now);
}

export async function getAllSections() {
  return db.select().from(homeSections).orderBy(asc(homeSections.sortOrder), asc(homeSections.updatedAt));
}

export async function getLiveSections() {
  const now = new Date();
  return (await getAllSections()).filter((s) => isLive(s, now));
}
