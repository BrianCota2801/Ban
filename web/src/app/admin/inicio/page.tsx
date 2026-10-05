import Link from "next/link";
import { createSection, deleteSection, moveSection, toggleSection } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Card, PageHead, Pill } from "@/components/admin/ui";
import { SECTION_TYPES } from "@/db/schema";
import { formatDate } from "@/lib/dates";
import { getAllSections, isLive, SECTION_HELP, SECTION_LABEL, sectionData } from "@/lib/home";

export const metadata = { title: "Página principal" };

function summary(s: Awaited<ReturnType<typeof getAllSections>>[number]) {
  const d = sectionData<Record<string, unknown>>(s);
  return String(d.heading || d.text || "");
}

export default async function HomeAdmin() {
  const sections = await getAllSections();
  const now = new Date();
  return (
    <>
      <PageHead title="Página principal">
        <Link href="/" target="_blank" className="btn-outline btn-sm">Ver página ↗</Link>
      </PageHead>
      <p className="-mt-4 mb-6 max-w-2xl text-sm text-muted">
        La página principal se arma con bloques. Ordénalos con las flechas, ocúltalos sin borrarlos o prográmalos con fecha de inicio y fin
        (por ejemplo, un banner que aparece el día del drop).
      </p>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card>
          {sections.length ? (
            <ol className="divide-y divide-line">
              {sections.map((s, i) => {
                const live = isLive(s, now);
                const scheduled = s.visible && !live;
                return (
                  <li key={s.id} className="flex flex-wrap items-center gap-4 py-3">
                    <div className="flex flex-col">
                      <form action={moveSection}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button disabled={i === 0} aria-label="Subir" className="px-2 text-muted hover:text-ink disabled:opacity-20">▲</button>
                      </form>
                      <form action={moveSection}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button disabled={i === sections.length - 1} aria-label="Bajar" className="px-2 text-muted hover:text-ink disabled:opacity-20">▼</button>
                      </form>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{SECTION_LABEL[s.type]}</p>
                      <Link href={`/admin/inicio/${s.id}`} className="block truncate font-bold hover:underline">
                        {s.title || summary(s) || "Sin título"}
                      </Link>
                      {(s.startsAt || s.endsAt) && (
                        <p className="text-xs text-muted">
                          {s.startsAt && `Desde ${formatDate(s.startsAt, true)}`} {s.endsAt && `hasta ${formatDate(s.endsAt, true)}`}
                        </p>
                      )}
                    </div>
                    {live ? <Pill tone="ok">Visible</Pill> : scheduled ? <Pill tone="warn">Programado</Pill> : <Pill tone="muted">Oculto</Pill>}
                    <div className="flex items-center gap-3 text-sm">
                      <form action={toggleSection}>
                        <input type="hidden" name="id" value={s.id} />
                        <button className="underline underline-offset-4">{s.visible ? "Ocultar" : "Mostrar"}</button>
                      </form>
                      <Link href={`/admin/inicio/${s.id}`} className="underline underline-offset-4">Editar</Link>
                      <form action={deleteSection}>
                        <input type="hidden" name="id" value={s.id} />
                        <ConfirmButton message="¿Eliminar este bloque? No se puede deshacer." className="text-sale underline underline-offset-4">Eliminar</ConfirmButton>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted">No hay bloques. Agrega el primero.</p>
          )}
        </Card>

        <Card title="Agregar bloque">
          <div className="grid gap-3">
            {SECTION_TYPES.map((t) => (
              <form key={t} action={createSection} className="border border-line p-3">
                <input type="hidden" name="type" value={t} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">{SECTION_LABEL[t]}</p>
                    <p className="help mt-0.5">{SECTION_HELP[t]}</p>
                  </div>
                  <button className="btn-outline btn-sm shrink-0">Agregar</button>
                </div>
              </form>
            ))}
          </div>
          <p className="help mt-3">Los bloques nuevos empiezan ocultos para que los prepares con calma.</p>
        </Card>
      </div>
    </>
  );
}
