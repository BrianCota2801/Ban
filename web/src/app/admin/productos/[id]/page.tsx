import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addProductImages, addVariants, deleteProduct, deleteProductImage, deleteVariant, updateStock } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ProductForm } from "@/components/admin/product-form";
import { Card, Input, PageHead, td, th } from "@/components/admin/ui";
import { db } from "@/db";
import { productImages, products, variants } from "@/db/schema";
import { SIZES, sortBySize, uniqueColors } from "@/lib/catalog";

export const metadata = { title: "Editar producto" };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) notFound();
  const vs = await db.select().from(variants).where(eq(variants.productId, id)).orderBy(asc(variants.sortOrder));
  const imgs = await db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder));
  const colors = uniqueColors(vs);

  return (
    <>
      <PageHead title={p.name} back={{ href: "/admin/productos", label: "Productos" }}>
        {p.status === "active" && (
          <Link href={`/productos/${p.slug}`} target="_blank" className="btn-outline btn-sm">Ver en tienda ↗</Link>
        )}
        <form action={deleteProduct}>
          <input type="hidden" name="id" value={p.id} />
          <ConfirmButton message="¿Eliminar este producto? Si ya tiene ventas, se archivará en lugar de borrarse." className="btn-outline btn-sm text-sale">
            Eliminar
          </ConfirmButton>
        </form>
      </PageHead>
      {sp.nuevo && (
        <p className="mb-6 border border-ok bg-white p-4 text-sm">
          Producto creado como <b>borrador</b>. Agrega colores, tallas y fotos; luego cambia el estado a <b>Publicado</b>.
        </p>
      )}

      <div className="grid gap-6 2xl:grid-cols-2">
        <Card title="Información">
          <ProductForm p={p} />
        </Card>

        <div className="grid content-start gap-6">
          <Card title="Colores, tallas e inventario">
            {vs.length ? (
              <div className="-mx-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr><th className={th}>Color</th><th className={th}>Talla</th><th className={th}>SKU</th><th className={th}>Piezas</th><th className={th}></th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {colors.flatMap((c) =>
                      sortBySize(vs.filter((v) => v.color === c.name)).map((v) => (
                        <tr key={v.id}>
                          <td className={td}>
                            <span className="flex items-center gap-2">
                              <span className="h-3.5 w-3.5 border border-black/15" style={{ background: v.colorHex }} />
                              {v.color}
                            </span>
                          </td>
                          <td className={`${td} font-bold`}>{v.size}</td>
                          <td className={`${td} num text-xs text-muted`}>{v.sku}</td>
                          <td className={td}>
                            <form action={updateStock} className="flex items-center gap-2">
                              <input type="hidden" name="id" value={v.id} />
                              <label htmlFor={`s-${v.id}`} className="sr-only">Piezas</label>
                              <input id={`s-${v.id}`} name="stock" type="number" min={0} defaultValue={v.stock} className={`input h-9 w-20 ${v.stock === 0 ? "border-sale" : ""}`} />
                              <button className="text-xs underline underline-offset-4">Guardar</button>
                            </form>
                          </td>
                          <td className={`${td} text-right`}>
                            <form action={deleteVariant}>
                              <input type="hidden" name="id" value={v.id} />
                              <ConfirmButton message={`¿Quitar ${v.color} ${v.size}?`} className="text-xs text-muted hover:text-sale">Quitar</ConfirmButton>
                            </form>
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted">Agrega al menos un color con sus tallas para poder vender este producto.</p>
            )}

            <div className="mt-6 border-t border-line pt-5">
              <p className="label mb-3">Agregar color</p>
              <ActionForm action={addVariants} submitLabel="Agregar tallas" resetOnSuccess>
                <input type="hidden" name="productId" value={p.id} />
                <div className="grid gap-4 sm:grid-cols-[1fr_120px_120px]">
                  <Input label="Nombre del color" name="color" placeholder="Negro" required />
                  <Input label="Muestra" name="colorHex" type="color" defaultValue="#111111" className="[&_input]:p-1" />
                  <Input label="Piezas por talla" name="stock" type="number" min={0} defaultValue={0} />
                </div>
                <fieldset>
                  <legend className="label mb-2">Tallas</legend>
                  <div className="flex flex-wrap gap-3">
                    {SIZES.map((s) => (
                      <label key={s} className="flex items-center gap-1.5 text-sm">
                        <input type="checkbox" name="sizes" value={s} defaultChecked={s !== "XS" && s !== "XXL"} className="accent-black" /> {s}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </ActionForm>
            </div>
          </Card>

          <Card title="Fotos" help="La primera foto es la portada. Asigna un color para que cambie al elegirlo en la tienda.">
            {imgs.length > 0 && (
              <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {imgs.map((i) => (
                  <figure key={i.id} className="grid gap-1">
                    <img src={`/media/${i.mediaId}`} alt="" className="aspect-[4/5] w-full border border-line object-cover" />
                    <figcaption className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted">{i.color ?? "Todos"}</span>
                      <form action={deleteProductImage}>
                        <input type="hidden" name="id" value={i.id} />
                        <ConfirmButton message="¿Quitar esta foto?" className="text-muted hover:text-sale">Quitar</ConfirmButton>
                      </form>
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
            <ActionForm action={addProductImages} submitLabel="Subir fotos">
              <input type="hidden" name="productId" value={p.id} />
              <div className="field">
                <label htmlFor="f-images" className="label">Fotos</label>
                <input id="f-images" type="file" name="images" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="text-sm file:mr-3 file:border file:border-ink file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase" />
                <p className="help">Vertical 4:5, fondo gris claro. Máximo 5 MB cada una.</p>
              </div>
              <div className="field">
                <label htmlFor="f-color" className="label">Color de estas fotos</label>
                <select id="f-color" name="color" className="input" defaultValue="">
                  <option value="">Todos los colores</option>
                  {colors.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
