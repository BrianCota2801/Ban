import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { NewsletterForm } from "./newsletter-form";
import { Logo } from "./site-header";

const COLUMNS = [
  {
    title: "Ayuda",
    links: [
      ["Envíos", "/ayuda/envios"],
      ["Cambios y devoluciones", "/ayuda/devoluciones"],
      ["Guía de tallas", "/ayuda/guia-de-tallas"],
      ["Preguntas frecuentes", "/ayuda/preguntas-frecuentes"],
    ],
  },
  {
    title: "BAN",
    links: [
      ["Nosotros", "/ayuda/nosotros"],
      ["Cuánto cuesta hacer una playera", "/ayuda/transparencia"],
      ["Drops", "/drops"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Términos y condiciones", "/ayuda/terminos"],
      ["Aviso de privacidad", "/ayuda/privacidad"],
    ],
  },
];

export async function SiteFooter() {
  const s = await getSettings();
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-x grid gap-12 py-14 md:grid-cols-[1.2fr_2fr]">
        <div className="grid content-start gap-4">
          <Logo className="text-4xl" />
          <p className="max-w-sm text-sm text-white/70">
            Básicos que duran, a precio justo. Recibe los drops y colaboraciones antes que nadie.
          </p>
          <div className="max-w-md">
            <NewsletterForm dark />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((c) => (
            <div key={c.title}>
              <h2 className="eyebrow text-white/60">{c.title}</h2>
              <ul className="mt-4 grid gap-2.5 text-sm">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="container-x flex flex-wrap items-center justify-between gap-3 border-t border-white/15 py-6 text-xs text-white/60">
        <span>© {new Date().getFullYear()} BAN. Nogales, Sonora, México.</span>
        <span className="flex gap-4">
          {s.contactEmail && <span>{s.contactEmail}</span>}
          {s.instagram && (
            <a href={s.instagram} className="hover:text-white" rel="noopener noreferrer" target="_blank">
              Instagram
            </a>
          )}
          {s.tiktok && (
            <a href={s.tiktok} className="hover:text-white" rel="noopener noreferrer" target="_blank">
              TikTok
            </a>
          )}
        </span>
      </div>
    </footer>
  );
}
