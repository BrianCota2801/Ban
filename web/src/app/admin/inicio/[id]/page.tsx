import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { deleteSection, saveSection } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { MediaField } from "@/components/admin/media-field";
import { Card, Input, PageHead, Select, Textarea } from "@/components/admin/ui";
import { HomeSectionView } from "@/components/home-sections";
import { db } from "@/db";
import { FITS, homeSections, products } from "@/db/schema";
import { FIT_LABEL } from "@/lib/catalog";
import { toLocalInput } from "@/lib/dates";
import {
  EMPTY_SLIDE,
  MAX_ITEMS,
  MAX_SLIDES,
  SECTION_HELP,
  SECTION_LABEL,
  sectionData,
  type BlockStyle,
  type CategoryGridData,
  type CountdownData,
  type EditorialData,
  type FitTilesData,
  type HeroData,
  type ProductGridData,
  type PromoStripData,
} from "@/lib/home";

export const metadata = { title: "Editar bloque" };

type ProductOption = { id: string; name: string; status: string; collection: string; releaseAt: Date | null };

export default async function EditSection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [s] = await db.select().from(homeSections).where(eq(homeSections.id, id)).limit(1);
  if (!s) notFound();
  const all: ProductOption[] =
    s.type === "product_grid" || s.type === "countdown"
      ? await db.select({ id: products.id, name: products.name, status: products.status, collection: products.collection, releaseAt: products.releaseAt }).from(products)
      : [];

  return (
    <>
      <PageHead title={SECTION_LABEL[s.type]} back={{ href: "/admin/inicio", label: "Página principal" }}>
        <form action={deleteSection}>
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton message="¿Eliminar este bloque?" className="btn-outline btn-sm text-sale">Eliminar</ConfirmButton>
        </form>
      </PageHead>
      <p className="-mt-4 mb-6 text-sm text-muted">{SECTION_HELP[s.type]}</p>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,620px)_1fr]">
        <Card>
          <ActionForm action={saveSection}>
            <input type="hidden" name="id" value={s.id} />
            <Fields s={s} products={all} />
            <details className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-bold">Programar y opciones del bloque</summary>
              <div className="mt-4 grid gap-4">
                <Input label="Nombre interno (opcional)" name="title" defaultValue={s.title} help="Solo lo ves tú, para ubicar el bloque en la lista." />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Mostrar desde" name="startsAt" type="datetime-local" defaultValue={toLocalInput(s.startsAt)} help="Hora de Sonora. Vacío = de inmediato." />
                  <Input label="Mostrar hasta" name="endsAt" type="datetime-local" defaultValue={toLocalInput(s.endsAt)} help="Vacío = sin fecha de fin." />
                </div>
              </div>
            </details>
            <label className="flex items-center gap-3 text-sm font-bold">
              <input type="checkbox" name="visible" defaultChecked={s.visible} className="h-4 w-4 accent-black" />
              Visible en la tienda
            </label>
          </ActionForm>
        </Card>
        <div className="min-w-0">
          <p className="label mb-2">Vista previa (último guardado)</p>
          <div className="pointer-events-none overflow-hidden rounded-xl border border-line bg-white">
            <HomeSectionView section={s} />
          </div>
        </div>
      </div>
    </>
  );
}

function StyleFields({ d }: { d: BlockStyle }) {
  return (
    <fieldset className="grid gap-4 rounded-xl border border-line p-4">
      <legend className="label px-1">Diseño del bloque</legend>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="field">
          <label htmlFor="f-bg" className="label">Fondo</label>
          <input id="f-bg" name="bg" type="color" defaultValue={d.bg || "#ffffff"} className="input h-11 p-1" />
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="bgNone" defaultChecked={!d.bg} className="accent-black" /> Sin color
          </label>
        </div>
        <Select label="Espaciado" name="spacing" defaultValue={d.spacing} options={[["none", "Sin espacio"], ["sm", "Chico"], ["md", "Normal"], ["lg", "Grande"]]} />
        <Select label="Ancho" name="width" defaultValue={d.width} options={[["contained", "Centrado"], ["full", "Toda la pantalla"]]} />
      </div>
    </fieldset>
  );
}

function Fields({ s, products: list }: { s: typeof homeSections.$inferSelect; products: ProductOption[] }) {
  switch (s.type) {
    case "hero": {
      const d = sectionData<HeroData>(s);
      const slides = d.slides.length < MAX_SLIDES ? [...d.slides, { ...EMPTY_SLIDE }] : d.slides;
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Altura" name="height" defaultValue={d.height} options={[["full", "Pantalla completa"], ["large", "Grande"], ["medium", "Mediana"], ["small", "Chica"]]} />
            <Input label="Cambiar cada (seg)" name="autoplay" type="number" min={0} max={30} defaultValue={d.autoplay} help="0 = solo con flechas." />
            <label className="flex items-center gap-2 self-center text-sm">
              <input type="checkbox" name="inset" defaultChecked={d.inset} className="h-4 w-4 accent-black" /> Con margen y esquinas
            </label>
          </div>
          {slides.map((sl, i) => {
            const isNew = i === d.slides.length;
            const p = `s${i}_`;
            return (
              <details key={i} open={i === 0 || isNew} className="rounded-xl border border-line p-4">
                <summary className="cursor-pointer text-sm font-bold">
                  {isNew ? "+ Agregar diapositiva" : `Diapositiva ${i + 1}${sl.heading ? ` · ${sl.heading}` : ""}`}
                </summary>
                {isNew && <p className="help mt-2">Llénala y guarda para sumarla al carrusel. Si la dejas vacía no se agrega.</p>}
                <div className="mt-4 grid gap-4">
                  <MediaField label="Foto o video" name={`${p}media`} defaultValue={sl.media} allowVideo help="Horizontal, mínimo 1600 px. Video MP4 corto y sin sonido, máx. 50 MB." />
                  <MediaField label="Versión para celular (opcional)" name={`${p}mobileMedia`} defaultValue={sl.mobileMedia} allowVideo help="Vertical. Si no la pones, se usa la de arriba." />
                  <Input label="Texto pequeño superior" name={`${p}eyebrow`} defaultValue={sl.eyebrow} placeholder="Nuevo · Drop 01" />
                  <Input label="Título" name={`${p}heading`} defaultValue={sl.heading} />
                  <Textarea label="Subtítulo" name={`${p}subheading`} defaultValue={sl.subheading} rows={2} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Texto del botón" name={`${p}ctaLabel`} defaultValue={sl.ctaLabel} />
                    <Input label="Enlace del botón" name={`${p}ctaHref`} defaultValue={sl.ctaHref} help="Ej: /productos o /drops" />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="Posición del texto"
                      name={`${p}position`}
                      defaultValue={sl.position}
                      options={[["bottom-left", "Abajo a la izquierda"], ["center-left", "Centro a la izquierda"], ["center", "Al centro"], ["bottom-center", "Abajo al centro"]]}
                    />
                    <Select label="Color del texto" name={`${p}tone`} defaultValue={sl.tone} options={[["dark", "Negro"], ["light", "Blanco"]]} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Input label="Oscurecer foto (%)" name={`${p}overlay`} type="number" min={0} max={70} step={5} defaultValue={sl.overlay} help="Ayuda a leer texto blanco." />
                    <Input label="Color de fondo" name={`${p}background`} type="color" defaultValue={sl.background} className="[&_input]:p-1" />
                    <Input label="Orden" name={`${p}order`} type="number" min={1} defaultValue={i + 1} />
                  </div>
                  {!isNew && (
                    <label className="flex items-center gap-2 text-sm text-sale">
                      <input type="checkbox" name={`${p}remove`} className="accent-black" /> Quitar esta diapositiva al guardar
                    </label>
                  )}
                </div>
              </details>
            );
          })}
        </>
      );
    }
    case "promo_strip": {
      const d = sectionData<PromoStripData>(s);
      return (
        <>
          <Input label="Texto" name="text" defaultValue={d.text} required placeholder="10 % de descuento con el código BIENVENIDA" />
          <Input label="Enlace (opcional)" name="href" defaultValue={d.href} />
          <Select label="Color" name="tone" defaultValue={d.tone} options={[["black", "Negro"], ["brand", "Color de marca"], ["red", "Rojo"], ["gray", "Gris"]]} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="marquee" defaultChecked={d.marquee} className="h-4 w-4 accent-black" /> Texto en movimiento
          </label>
        </>
      );
    }
    case "product_grid": {
      const d = sectionData<ProductGridData>(s);
      return (
        <>
          <Input label="Título" name="heading" defaultValue={d.heading} />
          <Input label="Subtítulo (opcional)" name="subheading" defaultValue={d.subheading} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Formato" name="layout" defaultValue={d.layout} options={[["grid", "Cuadrícula"], ["carousel", "Carrusel deslizable"]]} />
            <Select label="Por fila" name="columns" defaultValue={String(d.columns)} options={[["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]]} />
            <Input label="Máximo" name="limit" type="number" min={1} max={24} defaultValue={d.limit} />
          </div>
          <Select
            label="Qué productos mostrar"
            name="mode"
            defaultValue={d.mode}
            options={[["all", "Todos los publicados"], ["collection", "Una colección"], ["fit", "Un corte"], ["manual", "Los que yo elija"]]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Colección" name="collection" defaultValue={d.collection} options={[["core", "Core"], ["drop", "Drops"]]} />
            <Select label="Corte" name="fit" defaultValue={d.fit} options={FITS.map((f) => [f, FIT_LABEL[f]])} />
          </div>
          <fieldset className="field">
            <legend className="label mb-2">Elegidos (si escogiste “Los que yo elija”)</legend>
            <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-line p-3">
              {list.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="productIds" value={p.id} defaultChecked={d.productIds.includes(p.id)} className="accent-black" />
                  {p.name} {p.status !== "active" && <span className="text-xs text-muted">({p.status === "draft" ? "borrador" : "archivado"})</span>}
                </label>
              ))}
              {!list.length && <p className="help">Aún no hay productos.</p>}
            </div>
          </fieldset>
          <StyleFields d={d} />
        </>
      );
    }
    case "category_grid": {
      const d = sectionData<CategoryGridData>(s);
      const items = [...d.items];
      while (items.length < Math.min(MAX_ITEMS, d.items.length + 2)) items.push({ label: "", href: "", image: "" });
      return (
        <>
          <Input label="Título" name="heading" defaultValue={d.heading} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Forma de las fotos" name="shape" defaultValue={d.shape} options={[["rounded", "Esquinas redondeadas"], ["circle", "Círculo"], ["square", "Cuadrada"]]} />
            <Select label="Por fila (en computadora)" name="columns" defaultValue={String(d.columns)} options={[["3", "3"], ["4", "4"], ["6", "6"]]} />
          </div>
          {items.map((it, i) => (
            <details key={i} open={!it.label} className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-bold">{it.label || "+ Agregar categoría"}</summary>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Nombre" name={`c${i}_label`} defaultValue={it.label} placeholder="Playeras" />
                  <Input label="Enlace" name={`c${i}_href`} defaultValue={it.href} placeholder="/productos?corte=oversize" />
                </div>
                <MediaField label="Foto" name={`c${i}_image`} defaultValue={it.image} allowVideo help="Cuadrada, con fondo claro (como foto de producto)." />
                {it.label && (
                  <label className="flex items-center gap-2 text-sm text-sale">
                    <input type="checkbox" name={`c${i}_remove`} className="accent-black" /> Quitar al guardar
                  </label>
                )}
              </div>
            </details>
          ))}
          <StyleFields d={d} />
        </>
      );
    }
    case "fit_tiles": {
      const d = sectionData<FitTilesData>(s);
      return (
        <>
          <Input label="Título" name="heading" defaultValue={d.heading} />
          {[0, 1, 2, 3].map((i) => (
            <details key={i} open={i < d.tiles.length} className="rounded-xl border border-line p-4">
              <summary className="cursor-pointer text-sm font-bold">{d.tiles[i]?.label || `+ Tarjeta ${i + 1}`}</summary>
              <div className="mt-4 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Texto" name={`t${i}_label`} defaultValue={d.tiles[i]?.label ?? ""} help="Vacío = no se muestra." />
                  <Input label="Enlace" name={`t${i}_href`} defaultValue={d.tiles[i]?.href ?? ""} />
                </div>
                <MediaField label="Foto o video" name={`t${i}_image`} defaultValue={d.tiles[i]?.image} allowVideo help="Vertical 4:5. Sin foto se dibuja la silueta." />
              </div>
            </details>
          ))}
          <StyleFields d={d} />
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
          <MediaField label="Foto o video" name="media" defaultValue={d.media} allowVideo />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Foto a la" name="mediaSide" defaultValue={d.mediaSide} options={[["right", "Derecha"], ["left", "Izquierda"]]} />
            <Select label="Proporción" name="ratio" defaultValue={d.ratio} options={[["landscape", "Horizontal"], ["portrait", "Vertical"], ["square", "Cuadrada"]]} />
          </div>
          <StyleFields d={d} />
        </>
      );
    }
    case "countdown": {
      const d = sectionData<CountdownData>(s);
      const drops = list.filter((p) => p.collection === "drop");
      return (
        <>
          <Select
            label="Drop"
            name="productId"
            defaultValue={d.productId}
            options={[["", "Ninguno: usar la fecha de abajo"], ...drops.map((p) => [p.id, `${p.name}${p.releaseAt ? "" : " (sin fecha de lanzamiento)"}`] as [string, string])]}
            help="La cuenta regresiva usa la fecha de lanzamiento del producto."
          />
          <Input label="Fecha (si no elegiste drop)" name="until" type="datetime-local" defaultValue={toLocalInput(d.until ? new Date(d.until) : null)} help="Hora de Sonora." />
          <Input label="Texto pequeño superior" name="eyebrow" defaultValue={d.eyebrow} />
          <Input label="Título" name="heading" defaultValue={d.heading} />
          <Textarea label="Texto" name="text" defaultValue={d.text} rows={2} />
          <MediaField label="Fondo (foto o video, opcional)" name="media" defaultValue={d.media} allowVideo />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Color de fondo" name="background" type="color" defaultValue={d.background} className="[&_input]:p-1" />
            <Select label="Color del texto" name="tone" defaultValue={d.tone} options={[["light", "Blanco"], ["dark", "Negro"]]} />
            <Input label="Texto del botón" name="ctaLabel" defaultValue={d.ctaLabel} />
          </div>
          <Input label="Enlace cuando ya esté disponible" name="ctaHref" defaultValue={d.ctaHref} />
        </>
      );
    }
  }
}
