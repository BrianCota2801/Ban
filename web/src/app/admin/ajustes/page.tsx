import { saveStoreSettings } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { Card, Input, PageHead } from "@/components/admin/ui";
import { pesos } from "@/lib/money";
import { stripeEnabled } from "@/lib/payments";
import { getSettings } from "@/lib/settings";

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
