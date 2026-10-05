import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { siteUrl } from "@/lib/payments";
import "./globals.css";

// Todo el sitio depende de la sesión, el carrito y datos editables desde el panel:
// se genera en cada visita y nunca consulta la base de datos durante la compilación.
export const dynamic = "force-dynamic";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "BAN — Básicos que duran", template: "%s · BAN" },
  description: "Ropa básica de alta calidad a precio justo. Playeras heavyweight oversize, regular y boxy. Hecho para durar.",
  openGraph: { siteName: "BAN", locale: "es_MX", type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
