import { ImageResponse } from "next/og";
import { getActiveProducts, getSettings } from "@/lib/products";
import { site } from "@/lib/config";

export const alt = "Supportersshirt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

export default async function OgImage() {
  const [products, settings] = await Promise.all([getActiveProducts(), getSettings()]);
  const hero = products.find((p) => p.featured) ?? products[0];
  const img = hero?.image_front && !/\.webp/i.test(hero.image_front) ? hero.image_front : null;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 70, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 36, fontWeight: 800 }}>
            {site.name}
            <div style={{ width: 16, height: 16, borderRadius: 999, background: site.brandColor }} />
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1, marginTop: 30, textTransform: "uppercase" }}>
            {settings.hero_title || site.tagline}
          </div>
          <div style={{ fontSize: 30, color: "#a1a1aa", marginTop: 24 }}>{`Nu te bestellen · ${site.url.replace(/^https?:\/\//, "")}`}</div>
        </div>
        {img && (
          <div style={{ display: "flex", width: 480, alignItems: "center", justifyContent: "center", background: "#f4f4f5" }}>
            { }
            <img src={img} alt="" width={440} height={440} style={{ objectFit: "contain" }} />
          </div>
        )}
      </div>
    ),
    size,
  );
}
