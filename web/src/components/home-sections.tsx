import Link from "next/link";
import type { HomeSection } from "@/db/schema";
import { listProducts } from "@/lib/catalog";
import {
  sectionData,
  type EditorialData,
  type FitTilesData,
  type HeroData,
  type ProductGridData,
  type PromoStripData,
} from "@/lib/home";
import { ProductGrid } from "./product-card";
import { TeeArt } from "./tee-art";

export function HomeSectionView({ section }: { section: HomeSection }) {
  switch (section.type) {
    case "hero":
      return <Hero d={sectionData<HeroData>(section)} />;
    case "promo_strip":
      return <PromoStrip d={sectionData<PromoStripData>(section)} />;
    case "product_grid":
      return <ProductGridSection d={sectionData<ProductGridData>(section)} />;
    case "fit_tiles":
      return <FitTiles d={sectionData<FitTilesData>(section)} />;
    case "editorial":
      return <Editorial d={sectionData<EditorialData>(section)} />;
  }
}

export function Hero({ d }: { d: HeroData }) {
  const light = d.tone === "light";
  return (
    <section className="relative overflow-hidden" style={{ background: d.background }}>
      {d.imageId && (
        <img src={`/media/${d.imageId}`} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
      )}
      {!d.imageId && (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 items-center justify-center md:flex" aria-hidden="true">
          <TeeArt fit="oversize" color={light ? "#2a2a2a" : "#fafafa"} className="h-[85%]" />
        </div>
      )}
      <div
        className={`container-x relative flex min-h-[420px] flex-col justify-end py-12 md:min-h-[560px] md:justify-center ${
          d.align === "center" ? "items-center text-center" : "items-start"
        } ${light ? "text-white" : "text-ink"}`}
      >
        {d.eyebrow && <p className="eyebrow">{d.eyebrow}</p>}
        <h1 className="mt-3 max-w-2xl text-4xl font-black uppercase leading-[0.95] tracking-tight [font-stretch:110%] md:text-7xl">
          {d.heading}
        </h1>
        {d.subheading && <p className="mt-4 max-w-md text-base md:text-lg">{d.subheading}</p>}
        {d.ctaLabel && d.ctaHref && (
          <Link href={d.ctaHref} className={`mt-7 ${light ? "btn bg-white text-ink" : "btn"}`}>
            {d.ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

function PromoStrip({ d }: { d: PromoStripData }) {
  const tone = d.tone === "red" ? "bg-sale text-white" : d.tone === "gray" ? "bg-tile text-ink" : "bg-ink text-white";
  const inner = <span className="text-sm font-bold uppercase tracking-wider">{d.text}</span>;
  return (
    <section className={`${tone} py-4 text-center`}>
      <div className="container-x">{d.href ? <Link href={d.href} className="hover:underline">{inner}</Link> : inner}</div>
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
  const href = d.mode === "fit" ? `/productos?corte=${d.fit}` : d.mode === "collection" && d.collection === "drop" ? "/drops" : "/productos";
  return (
    <section className="container-x py-12 md:py-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        {d.heading && <h2 className="h-section">{d.heading}</h2>}
        <Link href={href} className="link shrink-0 text-sm">
          Ver todo
        </Link>
      </div>
      <ProductGrid items={shown} />
    </section>
  );
}

function FitTiles({ d }: { d: FitTilesData }) {
  const tones = ["#e9e7e2", "#dcdcdc", "#c9ccc6"];
  return (
    <section className="container-x py-12 md:py-16">
      {d.heading && <h2 className="h-section mb-6">{d.heading}</h2>}
      <div className={`grid gap-3 sm:grid-cols-2 ${d.tiles.length >= 3 ? "lg:grid-cols-3" : ""}`}>
        {d.tiles.map((t, i) => (
          <Link key={t.href + i} href={t.href} className="group relative block aspect-[4/5] overflow-hidden" style={{ background: tones[i % 3] }}>
            {t.imageId ? (
              <img src={`/media/${t.imageId}`} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            ) : (
              <TeeArt
                fit={t.label.toLowerCase()}
                color={["#111111", "#f7f7f5", "#8a8f86"][i % 3]}
                className="h-full w-full p-10 transition-transform duration-500 group-hover:scale-[1.03]"
              />
            )}
            <span className="absolute bottom-4 left-4 bg-white px-4 py-2 text-sm font-bold uppercase tracking-wider">{t.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Editorial({ d }: { d: EditorialData }) {
  return (
    <section className="container-x py-12 md:py-20">
      <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${d.imageSide === "left" ? "" : "md:[&>*:first-child]:order-2"}`}>
        <div className="aspect-[4/3] overflow-hidden bg-tile">
          {d.imageId ? (
            <img src={`/media/${d.imageId}`} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <TeeArt fit="regular" color="#d8d4cb" className="h-full w-full p-10" />
          )}
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
    </section>
  );
}
