import { ImageResponse } from "next/og";
import { site } from "@/lib/config";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", borderRadius: 14, color: "#fff", fontSize: 30, fontWeight: 800 }}>
        {site.name.slice(0, 2)}
        <div style={{ position: "absolute", right: 8, top: 8, width: 12, height: 12, borderRadius: 999, background: site.brandColor }} />
      </div>
    ),
    size,
  );
}
