import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { addVariants, deleteProduct, deleteProductImage, deleteVariant, moveProductImage, setProductImageColor, updateStock } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ProductForm } from "@/components/admin/product-form";
import { Card, Input, PageHead, td, th } from "@/components/admin/ui";
import { db } from "@/db";
import { productImages, products, variants } from "@/db/schema";
import { imageSrc, SIZES, sortBySize, uniqueColors } from "@/lib/catalog";
import { isVideo } from "@/lib/media-url";
import { ProductImageUploader } from "@/components/admin/product-images";

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

          <Card title="Fotos por color" help="Cada color tiene sus fotos: en la tienda, al elegir un color se muestran las suyas. La primera de cada color es su portada. Las “generales” se usan para los colores que no tienen fotos propias.">
            {colors.length === 0 && <p className="mb-4 text-sm text-muted">Primero agrega un color en “Colores, tallas e inventario”.</p>}
            <div className="grid gap-6">
              {[...colors.map((c) => ({ key: c.name, label: c.name, hex: c.hex as string | null })), { key: "", label: "Generales (todos los colores)", hex: null }].map((g) => {
                const group = imgs.filter((i) => (i.color ?? "") === g.key);
                return (
                  <section key={g.key || "_general"} className="rounded-xl border border-line p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                      {g.hex && <span className="h-4 w-4 rounded-full border border-black/15" style={{ background: g.hex }} />}
                      {g.label}
                      <span className="font-normal text-muted">· {group.length} {group.length === 1 ? "foto" : "fotos"}</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
                      {group.map((i, k) => {
                        const src = imageSrc(i);
                        return (
                          <figure key={i.id} className="grid content-start gap-1.5">
                            <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-line bg-tile">
                              {src && (isVideo(src) ? <video src={src} muted loop autoPlay playsInline className="h-full w-full object-cover" /> : <img src={src} alt="" className="h-full w-full object-cover" />)}
                              {k === 0 && <span className="tag absolute left-1.5 top-1.5 bg-ink text-white">Portada</span>}
                            </div>
                            <figcaption className="flex items-center justify-between gap-1 text-xs">
                              <span className="flex">
                                <form action={moveProductImage}>
                                  <input type="hidden" name="id" value={i.id} />
                                  <input type="hidden" name="dir" value="up" />
                                  <button disabled={k === 0} aria-label="Mover antes" className="px-1.5 py-1 text-muted hover:text-ink disabled:opacity-20">◀</button>
                                </form>
                                <form action={moveProductImage}>
                                  <input type="hidden" name="id" value={i.id} />
                                  <input type="hidden" name="dir" value="down" />
                                  <button disabled={k === group.length - 1} aria-label="Mover después" className="px-1.5 py-1 text-muted hover:text-ink disabled:opacity-20">▶</button>
                                </form>
                              </span>
                              <form action={deleteProductImage}>
                                <input type="hidden" name="id" value={i.id} />
                                <ConfirmButton message="¿Quitar esta foto?" className="px-1.5 py-1 text-muted hover:text-sale">Quitar</ConfirmButton>
                              </form>
                            </figcaption>
                            {colors.length > 0 && (
                              <form action={setProductImageColor} className="flex gap-1">
                                <input type="hidden" name="id" value={i.id} />
                                <label htmlFor={`col-${i.id}`} className="sr-only">Mover a otro color</label>
                                <select id={`col-${i.id}`} name="color" defaultValue={i.color ?? ""} className="input h-8 min-w-0 flex-1 px-2 text-xs">
                                  <option value="">General</option>
                                  {colors.map((c) => <option key={c.name}>{c.name}</option>)}
                                </select>
                                <button className="rounded-lg border border-line px-2 text-xs hover:border-ink">OK</button>
                              </form>
                            )}
                          </figure>
                        );
                      })}
                      <ProductImageUploader productId={p.id} color={g.key} label={g.key ? `Subir fotos de ${g.key}` : "Subir fotos generales"} />
                    </div>
                  </section>
                );
              })}
            </div>
            <p className="help mt-4">Fotos verticales 4:5 con fondo claro. Puedes elegir varias a la vez. Con Supabase Storage también acepta videos cortos.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
