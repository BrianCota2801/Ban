import { desc } from "drizzle-orm";
import Link from "next/link";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, Input, PageHead, Pill, Select, td, th } from "@/components/admin/ui";
import { db } from "@/db";
import { coupons } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { money } from "@/lib/money";

export const metadata = { title: "Promociones" };

export default async function PromosAdmin() {
  const list = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  const now = new Date();
  return (
    <>
      <PageHead title="Promociones" />
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-muted">
        Crea códigos de descuento. Para anunciarlos, agrega una <Link href="/admin/inicio" className="link">franja de promoción</Link> en la página
        principal o cambia el aviso superior en <Link href="/admin/ajustes" className="link">Ajustes</Link>.
      </p>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto border border-line bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line">
              <tr><th className={th}>Código</th><th className={th}>Descuento</th><th className={th}>Vigencia</th><th className={th}>Usos</th><th className={th}>Estado</th><th className={th}></th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((c) => {
                const expired = !!c.endsAt && c.endsAt <= now;
                const exhausted = c.maxUses != null && c.uses >= c.maxUses;
                return (
                  <tr key={c.id}>
                    <td className={`${td} num font-bold`}>{c.code}</td>
                    <td className={td}>
                      {c.kind === "percent" ? `${c.value} %` : money(c.value)}
                      {c.minSubtotal > 0 && <div className="text-xs text-muted">desde {money(c.minSubtotal)}</div>}
                    </td>
                    <td className={`${td} text-xs text-muted`}>
                      {c.startsAt ? formatDate(c.startsAt) : "Ya"} – {c.endsAt ? formatDate(c.endsAt) : "sin fin"}
                    </td>
                    <td className={`${td} num`}>{c.uses}{c.maxUses != null && ` / ${c.maxUses}`}</td>
                    <td className={td}>
                      {!c.active ? <Pill tone="muted">Pausado</Pill> : expired ? <Pill tone="muted">Vencido</Pill> : exhausted ? <Pill tone="muted">Agotado</Pill> : <Pill tone="ok">Activo</Pill>}
                    </td>
                    <td className={`${td} text-right`}>
                      <div className="flex justify-end gap-3 text-xs">
                        <form action={toggleCoupon}><input type="hidden" name="id" value={c.id} /><button className="underline underline-offset-4">{c.active ? "Pausar" : "Activar"}</button></form>
                        <form action={deleteCoupon}><input type="hidden" name="id" value={c.id} /><ConfirmButton message={`¿Eliminar ${c.code}?`} className="text-sale underline underline-offset-4">Eliminar</ConfirmButton></form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!list.length && <tr><td colSpan={6} className="p-8 text-center text-muted">Sin códigos todavía.</td></tr>}
            </tbody>
          </table>
        </div>
        <Card title="Nuevo código">
          <ActionForm action={saveCoupon} submitLabel="Crear código" resetOnSuccess>
            <Input label="Código" name="code" required placeholder="BIENVENIDA" className="[&_input]:uppercase" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Tipo" name="kind" options={[["percent", "Porcentaje"], ["fixed", "Monto fijo"]]} />
              <Input label="Valor" name="value" inputMode="decimal" required help="10 = 10 % o $10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Compra mínima" name="minSubtotal" inputMode="decimal" placeholder="0" />
              <Input label="Usos máximos" name="maxUses" type="number" min={1} placeholder="Sin límite" />
            </div>
            <Input label="Desde" name="startsAt" type="datetime-local" />
            <Input label="Hasta" name="endsAt" type="datetime-local" help="Hora de Sonora." />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
