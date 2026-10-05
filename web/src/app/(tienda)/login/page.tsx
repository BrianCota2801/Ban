import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Iniciar sesión", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/cuenta");
  return (
    <div className="container-x grid max-w-4xl gap-12 py-12 md:grid-cols-2 md:py-20">
      <section>
        <h1 className="h-section">Iniciar sesión</h1>
        <div className="mt-6">
          <LoginForm next={next} />
        </div>
      </section>
      <section className="border-t border-line pt-10 md:border-l md:border-t-0 md:pl-12 md:pt-0">
        <h2 className="h-section">¿Eres nuevo?</h2>
        <p className="mt-4 text-sm text-muted">Con una cuenta ves tus pedidos, compras más rápido y te enteras primero de los drops.</p>
        <Link href={next ? `/registro?next=${encodeURIComponent(next)}` : "/registro"} className="btn-outline mt-6 w-full">
          Crear cuenta
        </Link>
      </section>
    </div>
  );
}
