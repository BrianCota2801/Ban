import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
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
