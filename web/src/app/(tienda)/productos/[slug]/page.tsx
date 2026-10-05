import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { ProductGrid } from "@/components/product-card";
import { ProductView } from "@/components/product-view";
import { FIT_LABEL, getProductBySlug, listProducts } from "@/lib/catalog";
import { money } from "@/lib/money";
import { getSettings } from "@/lib/settings";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    openGraph: p.images[0] ? { images: [`/media/${p.images[0].mediaId}`] } : undefined,
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const [related, settings] = await Promise.all([listProducts(), getSettings()]);
  const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
  const soldOut = p.variants.length > 0 && p.variants.every((v) => v.stock <= 0);

  const specs = [
    ["Corte", FIT_LABEL[p.fit]],
    ["Gramaje", p.gsm ? `${p.gsm} g/m²` : ""],
    ["Composición", p.composition],
    ["Hecho en", p.madeIn],
    ["Cuidados", p.care],
  ].filter(([, v]) => v);

  return (
    <div className="container-x py-6 md:py-10">
      <nav className="mb-5 text-xs text-muted" aria-label="Ruta">
        <Link href="/" className="hover:underline">Inicio</Link> /{" "}
        <Link href="/productos" className="hover:underline">Playeras</Link> /{" "}
        <Link href={`/productos?corte=${p.fit}`} className="hover:underline">{FIT_LABEL[p.fit]}</Link>
      </nav>

      <ProductView
        name={p.name}
        fit={p.fit}
        images={p.images}
        colors={p.colors}
        variants={p.variants.map((v) => ({ id: v.id, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock }))}
        disabled={p.upcoming || soldOut}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted">
          {p.collection === "drop" ? "Drop · edición limitada" : "Core"} · {FIT_LABEL[p.fit]}
        </p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight md:text-3xl">{p.name}</h1>
        <p className="mt-3 text-2xl font-bold">
          <span className={onSale ? "text-sale" : ""}>{money(p.price)}</span>
          {onSale && <s className="ml-3 text-base font-normal text-muted">{money(p.compareAtPrice!)}</s>}
          <span className="ml-2 text-xs font-normal text-muted">IVA incluido</span>
        </p>
        {p.upcoming && p.releaseAt && (
          <div className="mt-6 bg-ink p-5 text-white">
            <p className="eyebrow mb-3 text-white/60">Sale a la venta en</p>
            <Countdown to={p.releaseAt.toISOString()} compact />
          </div>
        )}
        {soldOut && !p.upcoming && <p className="mt-4 text-sm font-bold text-sale">Agotado por ahora.</p>}
        {settings.freeShippingFrom > 0 && (
          <p className="mt-4 text-sm text-muted">Envío gratis en pedidos desde {money(settings.freeShippingFrom)}.</p>
        )}
      </ProductView>

      <section className="mt-16 grid gap-10 border-t border-line pt-10 lg:grid-cols-2">
        <div>
          <h2 className="h-section">Descripción</h2>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-muted">{p.description}</p>
        </div>
        {specs.length > 0 && (
          <div>
            <h2 className="h-section">Ficha de la prenda</h2>
            <dl className="mt-4 divide-y divide-line border-y border-line text-sm">
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9rem_1fr] gap-4 py-3">
                  <dt className="font-bold">{k}</dt>
                  <dd className="text-muted">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">
              ¿Por qué cuesta lo que cuesta? <Link href="/ayuda/transparencia" className="link">Mira el desglose</Link>.
            </p>
          </div>
        )}
      </section>

      {related.filter((r) => r.id !== p.id).length > 0 && (
        <section className="mt-20">
          <h2 className="h-section mb-6">También te puede gustar</h2>
          <ProductGrid items={related.filter((r) => r.id !== p.id).slice(0, 4)} />
        </section>
      )}
    </div>
  );
}
