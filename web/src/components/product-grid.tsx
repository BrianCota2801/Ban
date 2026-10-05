import type { ProductCard as Card } from "@/lib/catalog";
import { getFavoriteIds } from "@/lib/favorites";
import { ProductCard } from "./product-card";

const COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
};

/** Solo datos serializables al componente de cliente (sin fechas). */
export function cardData(p: Card) {
  const { releaseAt, ...rest } = p;
  void releaseAt;
  return rest;
}

export async function ProductGrid({ items, columns = 4 }: { items: Card[]; columns?: number }) {
  if (!items.length) return <p className="py-12 text-center text-sm text-muted">No hay productos para mostrar.</p>;
  const favs = await getFavoriteIds();
  return (
    <div className={`grid gap-x-3 gap-y-10 lg:gap-x-5 ${COLS[columns] ?? COLS[4]}`}>
      {items.map((p) => (
        <ProductCard key={p.id} p={cardData(p)} favorite={favs.has(p.id)} />
      ))}
    </div>
  );
}
