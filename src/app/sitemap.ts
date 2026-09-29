import type { MetadataRoute } from "next";
import { getActiveProducts } from "@/lib/products";
import { site } from "@/lib/config";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProducts();
  const staticPages = ["", "/maattabel", "/verzending", "/retourneren", "/contact", "/voorwaarden", "/privacy"];
  return [
    ...staticPages.map((p) => ({ url: `${site.url}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.5 : 1 })),
    ...products.map((p) => ({
      url: `${site.url}/shirt/${p.slug}`,
      lastModified: p.updated_at,
      changeFrequency: "daily" as const,
      priority: 0.9,
      images: [p.image_front, p.image_back].filter(Boolean) as string[],
    })),
  ];
}
