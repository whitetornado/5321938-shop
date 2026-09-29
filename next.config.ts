import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl?.protocol === "http:" ? "http" : "https",
        hostname: supabaseUrl?.hostname ?? "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // alleen voor lokaal testen met een mock-server
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === "1",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
