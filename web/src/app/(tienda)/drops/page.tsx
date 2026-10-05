import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { NewsletterForm } from "@/components/newsletter-form";
import { ProductGrid } from "@/components/product-card";
import { listProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Drops", description: "Ediciones limitadas y colaboraciones de BAN." };

export default async function DropsPage() {
  const drops = await listProducts({ collection: "drop" });
  const next = drops
    .filter((d) => d.upcoming && d.releaseAt)
    .sort((a, b) => a.releaseAt!.getTime() - b.releaseAt!.getTime())[0];
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-x grid gap-8 py-14 md:grid-cols-2 md:items-end md:py-20">
          <div>
            <p className="eyebrow text-white/60">Ediciones limitadas</p>
            <h1 className="mt-3 text-5xl font-black uppercase leading-[0.9] tracking-tight [font-stretch:115%] md:text-7xl">Drops</h1>
            <p className="mt-4 max-w-md text-white/70">
              Colores de temporada, gráficos numerados y colaboraciones. Cantidades cortas y sin resurtido.
            </p>
          </div>
          <div className="grid gap-4">
            {next ? (
              <>
                <p className="eyebrow text-white/60">Próximo drop · {next.name}</p>
                <Countdown to={next.releaseAt!.toISOString()} />
              </>
            ) : (
              <p className="eyebrow text-white/60">Avísame del próximo drop</p>
            )}
            <NewsletterForm source={next ? `drop:${next.slug}` : "drops"} cta="Avisarme" dark />
          </div>
        </div>
      </section>
      <div className="container-x py-12">
        <ProductGrid items={drops} />
      </div>
    </>
  );
}
