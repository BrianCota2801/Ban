import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { getCurrentUser } from "@/lib/auth";
import { listProductsByIds } from "@/lib/catalog";
import { getFavoriteIds } from "@/lib/favorites";

export const metadata: Metadata = { title: "Favoritos", robots: { index: false } };

export default async function FavoritesPage() {
  const [ids, user] = await Promise.all([getFavoriteIds(), getCurrentUser()]);
  const items = await listProductsByIds([...ids]);
  return (
    <div className="container-x py-8 md:py-12">
      <h1 className="text-3xl font-black uppercase tracking-tight">Favoritos</h1>
      {!user && items.length > 0 && (
        <p className="mt-2 text-sm text-muted">
          <Link href="/login?next=/favoritos" className="link text-ink">Inicia sesión</Link> para guardarlos en tu cuenta y verlos en cualquier dispositivo.
        </p>
      )}
      <div className="mt-8">
        {items.length ? (
          <ProductGrid items={items} />
        ) : (
          <div className="r-card grid justify-items-center gap-4 bg-tile px-6 py-16 text-center">
            <p className="text-lg font-bold">Aún no tienes favoritos</p>
            <p className="max-w-sm text-sm text-muted">Toca el corazón en cualquier playera para guardarla aquí.</p>
            <Link href="/productos" className="btn mt-2">Ver playeras</Link>
          </div>
        )}
      </div>
    </div>
  );
}
