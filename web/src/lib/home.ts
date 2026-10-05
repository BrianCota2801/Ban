import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { homeSections, type Fit, type HomeSection, type SectionType } from "@/db/schema";

// Opciones de estilo comunes a casi todos los bloques.
export type BlockStyle = { bg: string; spacing: "none" | "sm" | "md" | "lg"; width: "contained" | "full" };

export type HeroSlide = {
  eyebrow: string;
  heading: string;
  subheading: string;
  ctaLabel: string;
  ctaHref: string;
  media: string; // foto o video
  mobileMedia: string; // opcional: versión vertical para celular
  background: string;
  tone: "light" | "dark";
  position: "bottom-left" | "center-left" | "center" | "bottom-center";
  overlay: number; // 0–70 % de oscurecido sobre la imagen
};
export type HeroData = {
  slides: HeroSlide[];
  height: "full" | "large" | "medium" | "small";
  autoplay: number; // segundos entre diapositivas, 0 = manual
  inset: boolean; // con margen y esquinas redondeadas en lugar de borde a borde
};
export type PromoStripData = { text: string; href: string; tone: "black" | "red" | "gray" | "brand"; marquee: boolean };
export type ProductGridData = BlockStyle & {
  heading: string;
  subheading: string;
  mode: "all" | "manual" | "collection" | "fit";
  productIds: string[];
  collection: "core" | "drop";
  fit: Fit;
  limit: number;
  layout: "grid" | "carousel";
  columns: 2 | 3 | 4 | 5;
};
export type CategoryItem = { label: string; href: string; image: string };
export type CategoryGridData = BlockStyle & {
  heading: string;
  items: CategoryItem[];
  shape: "circle" | "rounded" | "square";
  columns: 3 | 4 | 6;
};
export type FitTilesData = BlockStyle & { heading: string; tiles: CategoryItem[] };
export type EditorialData = BlockStyle & {
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  media: string;
  mediaSide: "left" | "right";
  ratio: "landscape" | "portrait" | "square";
};
export type CountdownData = {
  eyebrow: string;
  heading: string;
  text: string;
  productId: string; // drop con fecha de lanzamiento; si está vacío se usa "until"
  until: string; // ISO
  media: string;
  ctaLabel: string;
  ctaHref: string;
  tone: "light" | "dark";
  background: string;
};

export const SECTION_LABEL: Record<SectionType, string> = {
  hero: "Banner / carrusel",
  promo_strip: "Franja de promoción",
  product_grid: "Productos",
  category_grid: "Categorías con imagen",
  fit_tiles: "Tarjetas grandes",
  editorial: "Texto con foto o video",
  countdown: "Cuenta regresiva",
};

export const SECTION_HELP: Record<SectionType, string> = {
  hero: "Foto o video grande con título y botón. Agrega varias diapositivas para un carrusel.",
  promo_strip: "Una línea destacada, fija o en movimiento: cupones, envío gratis, lanzamientos.",
  product_grid: "Productos en cuadrícula o carrusel: todos, una colección, un corte o los que elijas.",
  category_grid: "Íconos con foto para entrar por categoría, como en las grandes tiendas.",
  fit_tiles: "Tarjetas grandes verticales con foto, por ejemplo Oversize, Regular y Boxy.",
  editorial: "Cuenta la historia de la marca o de una colaboración con foto o video.",
  countdown: "Cuenta regresiva para un drop, con fondo de foto o video.",
};

export const MAX_SLIDES = 6;
export const MAX_ITEMS = 12;

const STYLE: BlockStyle = { bg: "", spacing: "md", width: "contained" };

export const EMPTY_SLIDE: HeroSlide = {
  eyebrow: "",
  heading: "",
  subheading: "",
  ctaLabel: "",
  ctaHref: "",
  media: "",
  mobileMedia: "",
  background: "#e9e7e2",
  tone: "dark",
  position: "bottom-left",
  overlay: 0,
};

export const SECTION_DEFAULTS: { [K in SectionType]: Record<string, unknown> } = {
  hero: {
    slides: [{ ...EMPTY_SLIDE, eyebrow: "Nuevo", heading: "Título del banner", ctaLabel: "Comprar", ctaHref: "/productos" }],
    height: "large",
    autoplay: 6,
    inset: false,
  } satisfies HeroData,
  promo_strip: { text: "Texto de la promoción", href: "/productos", tone: "black", marquee: false } satisfies PromoStripData,
  product_grid: {
    ...STYLE,
    heading: "Productos",
    subheading: "",
    mode: "all",
    productIds: [],
    collection: "core",
    fit: "oversize",
    limit: 8,
    layout: "grid",
    columns: 4,
  } satisfies ProductGridData,
  category_grid: {
    ...STYLE,
    heading: "Buscar por categoría",
    items: [
      { label: "Oversize", href: "/productos?corte=oversize", image: "" },
      { label: "Regular", href: "/productos?corte=regular", image: "" },
      { label: "Boxy", href: "/productos?corte=boxy", image: "" },
      { label: "Drops", href: "/drops", image: "" },
    ],
    shape: "rounded",
    columns: 6,
  } satisfies CategoryGridData,
  fit_tiles: {
    ...STYLE,
    heading: "Compra por corte",
    tiles: [
      { label: "Oversize", href: "/productos?corte=oversize", image: "" },
      { label: "Regular", href: "/productos?corte=regular", image: "" },
      { label: "Boxy", href: "/productos?corte=boxy", image: "" },
    ],
  } satisfies FitTilesData,
  editorial: {
    ...STYLE,
    heading: "Título",
    body: "Texto",
    ctaLabel: "",
    ctaHref: "",
    media: "",
    mediaSide: "right",
    ratio: "landscape",
  } satisfies EditorialData,
  countdown: {
    eyebrow: "Próximo drop",
    heading: "Drop 01",
    text: "",
    productId: "",
    until: "",
    media: "",
    ctaLabel: "Avísame",
    ctaHref: "/drops",
    tone: "light",
    background: "#111111",
  } satisfies CountdownData,
};

/** Datos del bloque con valores por defecto; convierte el formato de la primera versión (imageId). */
export function sectionData<T>(s: HomeSection): T {
  const raw = { ...(s.data ?? {}) } as Record<string, unknown>;
  if (s.type === "hero" && !Array.isArray(raw.slides)) {
    raw.slides = [
      {
        ...EMPTY_SLIDE,
        ...raw,
        media: (raw.imageId as string) ?? "",
        position: raw.align === "center" ? "center" : "bottom-left",
      },
    ];
  }
  if (s.type === "fit_tiles" && Array.isArray(raw.tiles))
    raw.tiles = (raw.tiles as Record<string, unknown>[]).map((t) => ({ image: (t.imageId as string) ?? "", ...t }));
  if (s.type === "editorial" && raw.media === undefined) {
    raw.media = (raw.imageId as string) ?? "";
    if (raw.imageSide) raw.mediaSide = raw.imageSide;
  }
  const out = { ...SECTION_DEFAULTS[s.type], ...raw } as Record<string, unknown>;
  if (s.type === "hero") out.slides = (out.slides as HeroSlide[]).map((sl) => ({ ...EMPTY_SLIDE, ...sl }));
  return out as T;
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
