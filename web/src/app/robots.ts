import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/payments";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/cuenta", "/carrito", "/checkout", "/pedido", "/api"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
