import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { site } from "@/lib/config";
import "./globals.css";

// Zelf-gehoste fonts: sneller en geen verzoeken naar Google (AVG-vriendelijk)
const inter = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});
const display = localFont({
  src: [
    { path: "./fonts/barlow-condensed-latin-700-normal.woff2", weight: "700" },
    { path: "./fonts/barlow-condensed-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: `${site.tagline}. Bestel eenvoudig in jouw maat, veilig betalen met iDEAL en snel in huis met track & trace.`,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: site.name,
    url: site.url,
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="nl"
      className={`${inter.variable} ${display.variable}`}
      style={{ ["--brand" as string]: site.brandColor }}
    >
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ style: { borderRadius: 14 } }}
        />
      </body>
    </html>
  );
}
