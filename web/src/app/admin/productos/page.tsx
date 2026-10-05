import { asc, inArray } from "drizzle-orm";
import Link from "next/link";
import { PageHead, Pill, td, th } from "@/components/admin/ui";
import { TeeArt } from "@/components/tee-art";
import { db } from "@/db";
import { productImages, products, variants } from "@/db/schema";
import { FIT_LABEL } from "@/lib/catalog";
import { money } from "@/lib/money";

export const metadata = { title: "Productos" };

export default async function ProductsAdmin() {
  const list = await db.select().from(products).orderBy(asc(products.sortOrder), asc(products.createdAt));
  const ids = list.map((p) => p.id);
  const vs = ids.length ? await db.select().from(variants).where(inArray(variants.productId, ids)) : [];
  const imgs = ids.length ? await db.select().from(productImages).where(inArray(productImages.productId, ids)).orderBy(asc(productImages.sortOrder)) : [];

  return (
    <>
      <PageHead title="Productos">
        <Link href="/admin/productos/nuevo" className="btn btn-sm">Nuevo producto</Link>
      </PageHead>
      <div className="overflow-x-auto border border-line bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-line">
            <tr><th className={th}>Producto</th><th className={th}>Corte</th><th className={th}>Estado</th><th className={th}>Precio</th><th className={th}>Colores</th><th className={`${th} text-right`}>Inventario</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const pv = vs.filter((v) => v.productId === p.id);
              const stock = pv.reduce((s, v) => s + v.stock, 0);
              const img = imgs.find((i) => i.productId === p.id);
              return (
                <tr key={p.id} className="hover:bg-tile/50">
                  <td className={td}>
                    <Link href={`/admin/productos/${p.id}`} className="flex items-center gap-3 font-bold hover:underline">
                      <span className="h-12 w-10 shrink-0 bg-tile">
                        {img ? <img src={`/media/${img.mediaId}`} alt="" className="h-full w-full object-cover" /> : <TeeArt fit={p.fit} color={pv[0]?.colorHex ?? "#eee"} className="h-full w-full p-1" />}
                      </span>
                      {p.name}
                    </Link>
                  </td>
                  <td className={td}>{FIT_LABEL[p.fit]}{p.collection === "drop" && <span className="ml-2 text-xs text-muted">Drop</span>}</td>
                  <td className={td}>
                    {p.status === "active" ? <Pill tone="ok">Publicado</Pill> : p.status === "draft" ? <Pill tone="warn">Borrador</Pill> : <Pill tone="muted">Archivado</Pill>}
                  </td>
                  <td className={`${td} num`}>{money(p.price)}</td>
                  <td className={td}>
                    <span className="flex gap-1">
                      {[...new Map(pv.map((v) => [v.color, v.colorHex]))].map(([c, h]) => (
                        <span key={c} title={c} className="h-3.5 w-3.5 border border-black/15" style={{ background: h }} />
                      ))}
                    </span>
                  </td>
                  <td className={`${td} num text-right ${stock === 0 ? "font-bold text-sale" : ""}`}>{stock}</td>
                </tr>
              );
            })}
            {!list.length && (
              <tr><td colSpan={6} className="p-8 text-center text-muted">Aún no hay productos.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
