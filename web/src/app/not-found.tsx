import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="text-7xl font-black tracking-tight [font-stretch:125%]">404</p>
        <p className="mt-3 text-muted">Esta página no existe o ya no está disponible.</p>
        <Link href="/" className="btn mt-8">Volver al inicio</Link>
      </div>
    </div>
  );
}
