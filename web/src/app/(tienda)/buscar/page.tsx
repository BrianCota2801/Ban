import type { Metadata } from "next";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { ProductGrid } from "@/components/product-grid";
import { searchProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Buscar", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").slice(0, 60);
  const items = q ? await searchProducts(q) : [];
  return (
    <div className="container-x py-8 md:py-12">
      <form action="/buscar" role="search" className="mx-auto max-w-2xl">
        <label htmlFor="q-page" className="sr-only">Buscar</label>
        <div className="flex h-14 items-center rounded-full border border-ink bg-white pl-6 pr-2">
          <input id="q-page" name="q" defaultValue={q} autoFocus={!q} placeholder="Buscar playeras, colores, cortes…" className="w-full bg-transparent text-lg outline-none" />
          <button type="submit" aria-label="Buscar" className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white">
            <SearchIcon />
          </button>
        </div>
      </form>
      {q && (
        <div className="mt-10">
          <p className="mb-6 text-sm text-muted">
            {items.length ? `${items.length} resultado${items.length === 1 ? "" : "s"} para “${q}”` : `Sin resultados para “${q}”.`}
          </p>
          {items.length ? (
            <ProductGrid items={items} />
          ) : (
            <Link href="/productos" className="btn-outline">Ver todas las playeras</Link>
          )}
        </div>
      )}
    </div>
  );
}
