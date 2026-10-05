import { saveStoreSettings } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Card, Input, PageHead } from "@/components/admin/ui";
import { pesos } from "@/lib/money";
import { stripeEnabled } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { storageEnabled } from "@/lib/storage";

export const metadata = { title: "Ajustes" };

export default async function SettingsAdmin() {
  const s = await getSettings();
  return (
    <>
      <PageHead title="Ajustes" />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <ActionForm action={saveStoreSettings}>
            <fieldset className="grid gap-4">
              <legend className="label mb-3">Diseño de la tienda</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    ["round", "Redondeado", "999px", "18px"],
                    ["soft", "Suave", "8px", "8px"],
                    ["square", "Recto", "0px", "0px"],
                  ] as const
                ).map(([v, label, btn, card]) => (
                  <label key={v} className="cursor-pointer rounded-xl border border-line p-4 has-[:checked]:border-ink has-[:checked]:ring-1 has-[:checked]:ring-ink">
                    <input type="radio" name="corners" value={v} defaultChecked={s.corners === v} className="sr-only" />
                    <span className="block h-14 bg-tile" style={{ borderRadius: card }} />
                    <span className="mt-2 block h-7 bg-ink" style={{ borderRadius: btn }} />
                    <span className="mt-2 block text-sm font-bold">{label}</span>
                  </label>
                ))}
              </div>
              <div className="field max-w-xs">
                <label htmlFor="f-brandColor" className="label">Color de marca</label>
                <input id="f-brandColor" name="brandColor" type="color" defaultValue={s.brandColor} className="input h-11 p-1" />
                <p className="help">Botones principales y franjas “color de marca”. Elige un tono oscuro: el texto encima es blanco.</p>
              </div>
            </fieldset>
            <fieldset className="grid gap-4">
              <legend className="label mb-3">Aviso superior</legend>
              <Input label="Texto" name="announcement" defaultValue={s.announcement} help="La barra negra arriba de todo. Vacío = no se muestra." />
              <Input label="Enlace" name="announcementHref" defaultValue={s.announcementHref} />
            </fieldset>
            <fieldset className="grid gap-4">
              <legend className="label mb-3">Envíos</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Costo de envío (MXN)" name="shippingFlat" inputMode="decimal" defaultValue={pesos(s.shippingFlat)} />
                <Input label="Envío gratis desde (MXN)" name="freeShippingFrom" inputMode="decimal" defaultValue={pesos(s.freeShippingFrom)} help="0 = nunca gratis." />
              </div>
            </fieldset>
            <fieldset className="grid gap-4">
              <legend className="label mb-3">Contacto y redes</legend>
              <Input label="Correo de contacto" name="contactEmail" type="email" defaultValue={s.contactEmail} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Instagram (URL)" name="instagram" defaultValue={s.instagram} placeholder="https://instagram.com/ban.mx" />
                <Input label="TikTok (URL)" name="tiktok" defaultValue={s.tiktok} placeholder="https://tiktok.com/@ban.mx" />
              </div>
            </fieldset>
          </ActionForm>
        </Card>
        <Card title="Fotos y videos">
          <p className="text-sm">
            Supabase Storage:{" "}
            {storageEnabled() ? (
              <b className="text-ok">conectado</b>
            ) : (
              <b className="text-warn">no conectado: solo fotos de hasta 4 MB, sin videos</b>
            )}
          </p>
          {!storageEnabled() && (
            <ol className="mt-3 grid list-decimal gap-1.5 pl-5 text-sm text-muted">
              <li>En Supabase entra a <b>Project Settings → API</b> (o <b>API Keys</b>).</li>
              <li>Copia la <b>Project URL</b> y la llave <b>service_role</b> (o <i>secret</i>).</li>
              <li>En Vercel agrégalas como <code>SUPABASE_URL</code> y <code>SUPABASE_SERVICE_ROLE_KEY</code> (tipo Secret) y vuelve a publicar.</li>
            </ol>
          )}
        </Card>
        <Card title="Pagos">
          <p className="text-sm">
            Stripe: {stripeEnabled() ? <b className="text-ok">conectado</b> : <b className="text-warn">no conectado (modo demostración)</b>}
          </p>
          <p className="help mt-2">Las claves se configuran como variables de entorno en el servidor, nunca aquí, para que no queden en la base de datos.</p>
        </Card>
      </div>
    </>
  );
}
