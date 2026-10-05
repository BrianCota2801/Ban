import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteSection, saveSection } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, ImageInput, Input, PageHead, Select, Textarea } from "@/components/admin/ui";
import { HomeSectionView } from "@/components/home-sections";
import { db } from "@/db";
import { FITS, homeSections, products } from "@/db/schema";
import { FIT_LABEL } from "@/lib/catalog";
import { toLocalInput } from "@/lib/dates";
import {
  SECTION_HELP,
  SECTION_LABEL,
  sectionData,
  type EditorialData,
  type FitTilesData,
  type HeroData,
  type ProductGridData,
  type PromoStripData,
} from "@/lib/home";

export const metadata = { title: "Editar bloque" };

export default async function EditSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [s] = await db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1);
  if (!s) notFound();
  const all = s.type === "product_grid" ? await db.select({ id: products.id, name: products.name, status: products.status }).from(products) : [];

  return (
    <>
      <PageHead title={SECTION_LABEL[s.type]} back={{ href: "/admin/inicio", label: "Página principal" }}>
        <form action={deleteSection}>
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton message="¿Eliminar este bloque?" className="btn-outline btn-sm text-sale">Eliminar</ConfirmButton>
        </form>
      </PageHead>
      <p className="-mt-4 mb-6 text-sm text-muted">{SECTION_HELP[s.type]}</p>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,560px)_1fr]">
        <Card>
          <ActionForm action={saveSection}>
            <input type="hidden" name="id" value={s.id} />
            <Fields s={s} products={all} />
            <hr className="border-line" />
            <Input label="Nombre interno (opcional)" name="title" defaultValue={s.title} help="Solo lo ves tú, para ubicar el bloque en la lista." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Mostrar desde" name="startsAt" type="datetime-local" defaultValue={toLocalInput(s.startsAt)} help="Hora de Sonora. Vacío = de inmediato." />
              <Input label="Mostrar hasta" name="endsAt" type="datetime-local" defaultValue={toLocalInput(s.endsAt)} help="Vacío = sin fecha de fin." />
            </div>
            <label className="flex items-center gap-3 text-sm font-bold">
              <input type="checkbox" name="visible" defaultChecked={s.visible} className="h-4 w-4 accent-black" />
              Visible en la tienda
            </label>
          </ActionForm>
        </Card>
        <div>
          <p className="label mb-2">Vista previa (último guardado)</p>
          <div className="pointer-events-none overflow-hidden border border-line bg-white">
            <HomeSectionView section={s} />
          </div>
        </div>
      </div>
    </>
  );
}

function Fields({ s, products: list }: { s: typeof homeSections.$inferSelect; products: { id: string; name: string; status: string }[] }) {
  switch (s.type) {
    case "hero": {
      const d = sectionData<HeroData>(s);
      return (
        <>
          <Input label="Texto pequeño superior" name="eyebrow" defaultValue={d.eyebrow} placeholder="Nuevo · Drop 01" />
          <Input label="Título" name="heading" defaultValue={d.heading} required />
          <Textarea label="Subtítulo" name="subheading" defaultValue={d.subheading} rows={2} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Texto del botón" name="ctaLabel" defaultValue={d.ctaLabel} />
            <Input label="Enlace del botón" name="ctaHref" defaultValue={d.ctaHref} help="Ej: /productos o /drops" />
          </div>
          <ImageInput label="Imagen de fondo" name="image" currentId={d.imageId} help="Horizontal, mínimo 1600 px de ancho. Máx. 5 MB." />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Color de fondo" name="background" type="color" defaultValue={d.background} className="[&_input]:p-1" />
            <Select label="Color del texto" name="tone" defaultValue={d.tone} options={[["dark", "Negro"], ["light", "Blanco"]]} />
            <Select label="Alineación" name="align" defaultValue={d.align} options={[["left", "Izquierda"], ["center", "Centro"]]} />
          </div>
        </>
      );
    }
    case "promo_strip": {
      const d = sectionData<PromoStripData>(s);
      return (
        <>
          <Input label="Texto" name="text" defaultValue={d.text} required placeholder="10 % de descuento con el código BIENVENIDA" />
          <Input label="Enlace (opcional)" name="href" defaultValue={d.href} />
          <Select label="Color" name="tone" defaultValue={d.tone} options={[["black", "Negro"], ["red", "Rojo"], ["gray", "Gris"]]} />
        </>
      );
    }
    case "product_grid": {
      const d = sectionData<ProductGridData>(s);
      return (
        <>
          <Input label="Título" name="heading" defaultValue={d.heading} />
          <Select
            label="Qué productos mostrar"
            name="mode"
            defaultValue={d.mode}
            options={[["all", "Todos los publicados"], ["collection", "Una colección"], ["fit", "Un corte"], ["manual", "Los que yo elija"]]}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Colección" name="collection" defaultValue={d.collection} options={[["core", "Core"], ["drop", "Drops"]]} />
            <Select label="Corte" name="fit" defaultValue={d.fit} options={FITS.map((f) => [f, FIT_LABEL[f]])} />
            <Input label="Máximo" name="limit" type="number" min={1} max={24} defaultValue={d.limit} />
          </div>
          <fieldset className="field">
            <legend className="label mb-2">Elegidos (si escogiste “Los que yo elija”)</legend>
            <div className="grid max-h-56 gap-1 overflow-y-auto border border-line p-3">
              {list.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="productIds" value={p.id} defaultChecked={d.productIds.includes(p.id)} className="accent-black" />
                  {p.name} {p.status !== "active" && <span className="text-xs text-muted">({p.status === "draft" ? "borrador" : "archivado"})</span>}
                </label>
              ))}
              {!list.length && <p className="help">Aún no hay productos.</p>}
            </div>
          </fieldset>
        </>
      );
    }
    case "fit_tiles": {
      const d = sectionData<FitTilesData>(s);
      return (
        <>
          <Input label="Título" name="heading" defaultValue={d.heading} />
          {[0, 1, 2, 3].map((i) => (
            <fieldset key={i} className="grid gap-3 border border-line p-4">
              <legend className="label px-1">Tarjeta {i + 1}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Texto" name={`tile${i}Label`} defaultValue={d.tiles[i]?.label ?? ""} help={i === 3 ? "Vacío = no se muestra." : undefined} />
                <Input label="Enlace" name={`tile${i}Href`} defaultValue={d.tiles[i]?.href ?? ""} />
              </div>
              <ImageInput label="Imagen" name={`tile${i}Image`} currentId={d.tiles[i]?.imageId ?? null} help="Vertical 4:5. Sin imagen se dibuja la silueta." />
            </fieldset>
          ))}
        </>
      );
    }
    case "editorial": {
      const d = sectionData<EditorialData>(s);
      return (
        <>
          <Input label="Título" name="heading" defaultValue={d.heading} />
          <Textarea label="Texto" name="body" defaultValue={d.body} rows={6} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Texto del botón (opcional)" name="ctaLabel" defaultValue={d.ctaLabel} />
            <Input label="Enlace del botón" name="ctaHref" defaultValue={d.ctaHref} />
          </div>
          <ImageInput label="Imagen" name="image" currentId={d.imageId} />
          <Select label="Imagen a la" name="imageSide" defaultValue={d.imageSide} options={[["right", "Derecha"], ["left", "Izquierda"]]} />
        </>
      );
    }
  }
}
