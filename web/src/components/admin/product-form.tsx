import { saveProduct } from "@/app/admin/actions";
import { FITS, type Product } from "@/db/schema";
import { FIT_LABEL } from "@/lib/catalog";
import { toLocalInput } from "@/lib/dates";
import { pesos } from "@/lib/money";
import { ActionForm } from "./action-form";
import { Input, Select, Textarea } from "./ui";

export function ProductForm({ p }: { p?: Product }) {
  return (
    <ActionForm action={saveProduct} submitLabel={p ? "Guardar cambios" : "Crear producto"}>
      <input type="hidden" name="id" value={p?.id ?? ""} />
      <Input label="Nombre" name="name" defaultValue={p?.name} required placeholder="Playera Oversize Heavyweight" />
      <Input
        label="Dirección (URL)"
        name="slug"
        defaultValue={p?.slug}
        help="Se genera del nombre si la dejas vacía. Aparece como ban.mx/productos/…"
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
      />
      <Textarea label="Descripción" name="description" defaultValue={p?.description} rows={5} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Corte" name="fit" defaultValue={p?.fit ?? "oversize"} options={FITS.map((f) => [f, FIT_LABEL[f]])} />
        <Select label="Colección" name="collection" defaultValue={p?.collection ?? "core"} options={[["core", "Core (siempre disponible)"], ["drop", "Drop (edición limitada)"]]} />
        <Select
          label="Estado"
          name="status"
          defaultValue={p?.status ?? "draft"}
          options={[["draft", "Borrador (no se ve)"], ["active", "Publicado"], ["archived", "Archivado"]]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="Precio (MXN, con IVA)" name="price" inputMode="decimal" defaultValue={pesos(p?.price)} required placeholder="549" />
        <Input label="Precio anterior (opcional)" name="compareAtPrice" inputMode="decimal" defaultValue={pesos(p?.compareAtPrice)} help="Se muestra tachado si es mayor." />
        <Input label="Orden en la tienda" name="sortOrder" type="number" defaultValue={p?.sortOrder ?? 0} help="Menor = aparece primero." />
      </div>
      <Input
        label="Fecha de lanzamiento (drops)"
        name="releaseAt"
        type="datetime-local"
        defaultValue={toLocalInput(p?.releaseAt)}
        help="Hora de Sonora. Antes de esa fecha se ve con cuenta regresiva y no se puede comprar."
      />
      <fieldset className="grid gap-4 border border-line p-4">
        <legend className="label px-1">Ficha de la prenda</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Gramaje (g/m²)" name="gsm" type="number" min={80} max={600} defaultValue={p?.gsm ?? ""} />
          <Input label="Hecho en" name="madeIn" defaultValue={p?.madeIn} placeholder="México" />
        </div>
        <Input label="Composición" name="composition" defaultValue={p?.composition} placeholder="100 % algodón peinado" />
        <Input label="Cuidados" name="care" defaultValue={p?.care} placeholder="Lavar en frío, al revés. Secar a temperatura baja." />
      </fieldset>
    </ActionForm>
  );
}
