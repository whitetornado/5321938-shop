import { ImageResponse } from "next/og";
import { getProductBySlug } from "@/lib/products";
import { site } from "@/lib/config";
import { money } from "@/lib/format";

export const alt = "Supportersshirt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

const ok = (u: string | null) => Boolean(u && !/\.webp($|\?)/i.test(u));

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  const front = p && ok(p.image_front) ? p.image_front : null;
  const back = p && ok(p.image_back) ? p.image_back : null;
  const title = p?.name ?? site.tagline;
  const longest = Math.max(...title.split(/\s+/).map((w) => w.length));
  const fontSize = longest > 12 ? 46 : longest > 9 ? 56 : 64;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0a0a0a", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 60, width: 520 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 800 }}>
            {site.name}
            <div style={{ width: 16, height: 16, borderRadius: 999, background: site.brandColor }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize, fontWeight: 800, lineHeight: 1.05, textTransform: "uppercase" }}>
              {title}
            </div>
            {p && (
              <div style={{ display: "flex", marginTop: 26, alignItems: "center", gap: 18 }}>
                <div style={{ fontSize: 44, fontWeight: 800 }}>{money(p.price_cents)}</div>
                <div style={{ display: "flex", background: site.brandColor, borderRadius: 999, padding: "12px 26px", fontSize: 26, fontWeight: 700 }}>
                  Bestel nu →
                </div>
              </div>
            )}
          </div>
          <div style={{ fontSize: 24, color: "#a1a1aa" }}>{site.url.replace(/^https?:\/\//, "")}</div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", gap: 10, background: "#f4f4f5", paddingLeft: 20, paddingRight: 20 }}>
          {front && (
             
            <img src={front} alt="" width={back ? 320 : 560} height={back ? 320 : 560} style={{ objectFit: "contain" }} />
          )}
          {back && (
             
            <img src={back} alt="" width={320} height={320} style={{ objectFit: "contain" }} />
          )}
        </div>
      </div>
    ),
    size,
  );
}
