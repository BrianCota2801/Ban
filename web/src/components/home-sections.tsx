import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { products, type HomeSection } from "@/db/schema";
import { listProducts } from "@/lib/catalog";
import { getFavoriteIds } from "@/lib/favorites";
import {
  sectionData,
  type BlockStyle,
  type CategoryGridData,
  type CountdownData,
  type EditorialData,
  type FitTilesData,
  type HeroData,
  type ProductGridData,
  type PromoStripData,
} from "@/lib/home";
import { isVideo, mediaSrc } from "@/lib/media-url";
import { Countdown } from "./countdown";
import { HeroCarousel } from "./hero-carousel";
import { NewsletterForm } from "./newsletter-form";
import { ProductCard, ProductGrid } from "./product-card";
import { Scroller } from "./scroller";
import { TeeArt } from "./tee-art";

export function HomeSectionView({ section, first = false }: { section: HomeSection; first?: boolean }) {
  switch (section.type) {
    case "hero": {
      const d = sectionData<HeroData>(section);
      const slides = d.slides.filter((s) => s.heading || s.media || s.mobileMedia);
      if (!slides.length) return null;
      return <HeroCarousel slides={slides} height={d.height} autoplay={d.autoplay} inset={d.inset} priority={first} />;
    }
    case "promo_strip":
      return <PromoStrip d={sectionData<PromoStripData>(section)} />;
    case "product_grid":
      return <ProductGridSection d={sectionData<ProductGridData>(section)} />;
    case "category_grid":
      return <CategoryGrid d={sectionData<CategoryGridData>(section)} />;
    case "fit_tiles":
      return <FitTiles d={sectionData<FitTilesData>(section)} />;
    case "editorial":
      return <Editorial d={sectionData<EditorialData>(section)} />;
    case "countdown":
      return <CountdownBlock d={sectionData<CountdownData>(section)} />;
  }
}

const SPACING = { none: "py-0", sm: "py-6 md:py-8", md: "py-12 md:py-16", lg: "py-20 md:py-28" };

/** Envoltura común: color de fondo, espaciado y ancho elegidos en el panel. */
function Block({ s, children }: { s: BlockStyle; children: React.ReactNode }) {
  return (
    <section className={SPACING[s.spacing] ?? SPACING.md} style={s.bg ? { background: s.bg } : undefined}>
      <div className={s.width === "full" ? "w-full px-4 md:px-8" : "container-x"}>{children}</div>
    </section>
  );
}

function Media({ src, alt = "", className = "" }: { src: string; alt?: string; className?: string }) {
  return isVideo(src) ? (
    <video src={src} autoPlay muted loop playsInline className={`h-full w-full object-cover ${className}`} />
  ) : (
    <img src={src} alt={alt} loading="lazy" className={`h-full w-full object-cover ${className}`} />
  );
}

function PromoStrip({ d }: { d: PromoStripData }) {
  const tone =
    d.tone === "red" ? "bg-sale text-white" : d.tone === "gray" ? "bg-tile text-ink" : d.tone === "brand" ? "text-white" : "bg-ink text-white";
  const style = d.tone === "brand" ? { background: "var(--color-brand)" } : undefined;
  const text = <span className="text-sm font-bold uppercase tracking-wider">{d.text}</span>;
  const body = d.marquee ? (
    <div className="overflow-hidden" aria-label={d.text}>
      <div className="animate-marquee flex w-max gap-16" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="whitespace-nowrap text-sm font-bold uppercase tracking-wider">
            {d.text} <span className="mx-6 opacity-50">✦</span>
          </span>
        ))}
      </div>
    </div>
  ) : (
    <div className="container-x text-center">{text}</div>
  );
  return (
    <section className={`${tone} py-4`} style={style}>
      {d.href ? <Link href={d.href} className="block hover:opacity-90">{body}</Link> : body}
    </section>
  );
}

async function ProductGridSection({ d }: { d: ProductGridData }) {
  const items =
    d.mode === "manual"
      ? await listProducts({ ids: d.productIds })
      : d.mode === "collection"
        ? await listProducts({ collection: d.collection })
        : d.mode === "fit"
          ? await listProducts({ fit: d.fit })
          : await listProducts();
  const shown = items.slice(0, Math.max(1, d.limit || 8));
  if (!shown.length) return null;
  const href = d.mode === "fit" ? `/productos?corte=${d.fit}` : d.mode === "collection" && d.collection === "drop" ? "/drops" : "/productos";
  const favs = await getFavoriteIds();
  return (
    <Block s={d}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          {d.heading && <h2 className="h-section">{d.heading}</h2>}
          {d.subheading && <p className="mt-1 text-sm text-muted">{d.subheading}</p>}
        </div>
        <Link href={href} className="btn-outline btn-sm shrink-0">
          Ver todo
        </Link>
      </div>
      {d.layout === "carousel" ? (
        <Scroller columns={d.columns}>
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} favorite={favs.has(p.id)} />
          ))}
        </Scroller>
      ) : (
        <ProductGrid items={shown} columns={d.columns} />
      )}
    </Block>
  );
}

const SHAPE = { circle: "rounded-full aspect-square", rounded: "r-card aspect-square", square: "aspect-square" };
const CAT_COLS = { 3: "grid-cols-3", 4: "grid-cols-2 sm:grid-cols-4", 6: "grid-cols-3 md:grid-cols-6" };

function CategoryGrid({ d }: { d: CategoryGridData }) {
  const items = d.items.filter((i) => i.label);
  if (!items.length) return null;
  return (
    <Block s={d}>
      {d.heading && <h2 className="mb-6 text-2xl font-normal md:text-[28px]">{d.heading}</h2>}
      <div className={`grid gap-x-4 gap-y-8 ${CAT_COLS[d.columns] ?? CAT_COLS[6]}`}>
        {items.map((it, i) => {
          const src = mediaSrc(it.image);
          return (
            <Link key={i} href={it.href || "/productos"} className="group grid justify-items-center gap-3 text-center">
              <div className={`w-full max-w-[160px] overflow-hidden bg-tile ${SHAPE[d.shape] ?? SHAPE.rounded}`}>
                {src ? (
                  <Media src={src} alt={it.label} className="transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <TeeArt fit={it.label.toLowerCase()} color={["#111111", "#f7f7f5", "#8a8f86", "#5b4636", "#1e2536", "#c9c2b3"][i % 6]} className="h-full w-full p-4 transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <span className="text-[15px] group-hover:underline group-hover:underline-offset-4">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </Block>
  );
}

function FitTiles({ d }: { d: FitTilesData }) {
  const tones = ["#e9e7e2", "#dcdcdc", "#c9ccc6", "#e4e0d8"];
  const tiles = d.tiles.filter((t) => t.label);
  return (
    <Block s={d}>
      {d.heading && <h2 className="h-section mb-6">{d.heading}</h2>}
      <div className={`grid gap-3 sm:grid-cols-2 ${tiles.length >= 3 ? "lg:grid-cols-3" : ""} ${tiles.length >= 4 ? "xl:grid-cols-4" : ""}`}>
        {tiles.map((t, i) => {
          const src = mediaSrc(t.image);
          return (
            <Link key={i} href={t.href} className="r-card group relative block aspect-[4/5] overflow-hidden" style={{ background: tones[i % 4] }}>
              {src ? (
                <Media src={src} className="transition-transform duration-700 group-hover:scale-[1.04]" />
              ) : (
                <TeeArt fit={t.label.toLowerCase()} color={["#111111", "#f7f7f5", "#8a8f86", "#5b4636"][i % 4]} className="h-full w-full p-10 transition-transform duration-700 group-hover:scale-[1.04]" />
              )}
              <span className="r-btn absolute bottom-4 left-4 bg-white px-5 py-2.5 text-sm font-bold uppercase tracking-wider">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </Block>
  );
}

const RATIO = { landscape: "aspect-[4/3]", portrait: "aspect-[4/5]", square: "aspect-square" };

function Editorial({ d }: { d: EditorialData }) {
  const src = mediaSrc(d.media);
  return (
    <Block s={d}>
      <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${d.mediaSide === "left" ? "" : "md:[&>*:first-child]:order-2"}`}>
        <div className={`r-card overflow-hidden bg-tile ${RATIO[d.ratio] ?? RATIO.landscape}`}>
          {src ? <Media src={src} /> : <TeeArt fit="regular" color="#d8d4cb" className="h-full w-full p-10" />}
        </div>
        <div className="max-w-lg">
          <h2 className="text-3xl font-black uppercase leading-none tracking-tight [font-stretch:110%] md:text-5xl">{d.heading}</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-relaxed text-muted">{d.body}</p>
          {d.ctaLabel && d.ctaHref && (
            <Link href={d.ctaHref} className="btn-outline mt-7">
              {d.ctaLabel}
            </Link>
          )}
        </div>
      </div>
    </Block>
  );
}

async function CountdownBlock({ d }: { d: CountdownData }) {
  let until = d.until ? new Date(d.until) : null;
  let productHref: string | null = null;
  let slug = "";
  if (/^[0-9a-f-]{36}$/i.test(d.productId)) {
    const [p] = await db.select({ slug: products.slug, releaseAt: products.releaseAt }).from(products).where(eq(products.id, d.productId)).limit(1);
    if (p) {
      until = p.releaseAt;
      productHref = `/productos/${p.slug}`;
      slug = p.slug;
    }
  }
  const live = !until || Number.isNaN(until.getTime()) || until.getTime() <= Date.now();
  const src = mediaSrc(d.media);
  const light = d.tone === "light";
  return (
    <section className="relative overflow-hidden" style={{ background: d.background || "#111111" }}>
      {src && (
        <div className="absolute inset-0">
          <Media src={src} />
          <div className="absolute inset-0 bg-black/45" />
        </div>
      )}
      <div className={`container-x relative grid gap-8 py-16 md:grid-cols-2 md:items-end md:py-24 ${light ? "text-white" : "text-ink"}`}>
        <div>
          {d.eyebrow && <p className="eyebrow opacity-70">{d.eyebrow}</p>}
          <h2 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-tight [font-stretch:115%] md:text-7xl">{d.heading}</h2>
          {d.text && <p className="mt-4 max-w-md opacity-80">{d.text}</p>}
        </div>
        <div className="grid gap-5">
          {live ? (
            <Link href={productHref ?? (d.ctaHref || "/drops")} className={light ? "btn bg-white! text-ink!" : "btn"}>
              Ya disponible · Comprar
            </Link>
          ) : (
            <>
              <Countdown to={until!.toISOString()} />
              <div className="max-w-md">
                <NewsletterForm source={slug ? `drop:${slug}` : "drops"} cta={d.ctaLabel || "Avísame"} dark={light} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
