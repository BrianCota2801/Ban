import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGES } from "@/lib/pages";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = PAGES[(await params).slug];
  return page ? { title: page.title, description: page.description } : {};
}

export default async function HelpPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  if (!page) notFound();
  return (
    <div className="container-x grid gap-10 py-10 md:grid-cols-[220px_1fr] md:py-14">
      <nav className="grid content-start gap-2 text-sm" aria-label="Ayuda">
        {Object.entries(PAGES).map(([s, p]) => (
          <Link key={s} href={`/ayuda/${s}`} className={s === slug ? "font-bold" : "text-muted hover:text-ink"}>
            {p.title}
          </Link>
        ))}
      </nav>
      <article className="grid max-w-2xl content-start gap-3">
        <h1 className="mb-2 text-3xl font-black uppercase tracking-tight">{page.title}</h1>
        {page.body}
      </article>
    </div>
  );
}
