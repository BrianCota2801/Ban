import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/catalog";
import { PAGES } from "@/lib/pages";
import { siteUrl } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const products = await listProducts();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/drops`, changeFrequency: "weekly", priority: 0.8 },
    ...products.map((p) => ({ url: `${base}/productos/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...Object.keys(PAGES).map((s) => ({ url: `${base}/ayuda/${s}`, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
