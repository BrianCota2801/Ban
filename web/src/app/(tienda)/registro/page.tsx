import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Crear cuenta", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="container-x max-w-md py-12 md:py-20">
      <h1 className="h-section">Crear cuenta</h1>
      <div className="mt-6">
        <RegisterForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm">
        ¿Ya tienes cuenta? <Link href="/login" className="link">Inicia sesión</Link>
      </p>
    </div>
  );
}
