import type { MetadataRoute } from "next";
import { site } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  // Besloten shop (toegangscode): niets laten indexeren
  if (process.env.ACCESS_CODE_REQUIRED === "true") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/bedankt", "/winkelwagen"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
