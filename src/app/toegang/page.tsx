import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { site } from "@/lib/config";
import { AccessForm } from "./AccessForm";

export const metadata: Metadata = {
  title: "Toegang",
  description: "Alleen toegankelijk met een persoonlijke toegangscode.",
  robots: { index: false, follow: false },
  openGraph: { title: site.name, description: "Alleen toegankelijk met een persoonlijke toegangscode.", images: [] },
};

export default async function AccessPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-2">
          <span className="font-display text-2xl font-extrabold">{site.name}</span>
          <span className="size-2.5 rounded-full bg-brand" />
        </div>
        <div className="mt-8 flex size-12 items-center justify-center rounded-full bg-zinc-100">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display mt-4 text-3xl font-extrabold uppercase">Alleen op uitnodiging</h1>
        <p className="mt-2 text-sm text-zinc-600">Vul de persoonlijke code in die je hebt ontvangen.</p>
        <AccessForm next={next ?? "/"} />
      </div>
    </div>
  );
}
