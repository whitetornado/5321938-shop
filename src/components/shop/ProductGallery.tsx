"use client";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";

type Img = { src: string; label: string };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const n = images.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, go]);

  // swipe
  const [touchX, setTouchX] = useState<number | null>(null);
  const onTouchEnd = (x: number) => {
    if (touchX === null) return;
    const dx = x - touchX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    setTouchX(null);
  };

  if (!n) return <div className="aspect-square rounded-3xl bg-zinc-100" />;
  const cur = images[i];

  return (
    <div className="md:sticky md:top-24">
      <div
        className="group relative aspect-square overflow-hidden rounded-3xl bg-linear-to-b from-zinc-100 to-zinc-200/70"
        onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
        onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}
      >
        {images.map((img, idx) => (
          <Image
            key={img.src}
            src={img.src}
            alt={`${name} — ${img.label}`}
            fill
            priority={idx === 0}
            sizes="(min-width: 768px) 55vw, 100vw"
            className={`object-contain p-4 transition-opacity duration-300 ${idx === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
        <button
          onClick={() => setZoom(true)}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2.5 shadow-sm backdrop-blur transition hover:scale-105"
          aria-label="Vergroot afbeelding"
        >
          <Expand className="size-4" />
        </button>
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-sm group-hover:block" aria-label="Vorige">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-sm group-hover:block" aria-label="Volgende">
              <ChevronRight className="size-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-full bg-white/90 p-1 text-xs font-semibold shadow-sm backdrop-blur">
              {images.slice(0, 2).map((img, idx) => (
                <button
                  key={img.label}
                  onClick={() => setI(idx)}
                  aria-pressed={i === idx}
                  className={`rounded-full px-3.5 py-1.5 transition ${i === idx ? "bg-ink text-white" : "text-zinc-600"}`}
                >
                  {img.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img.src}
              onClick={() => setI(idx)}
              className={`relative size-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-2 transition ${idx === i ? "ring-ink" : "ring-transparent hover:ring-zinc-300"}`}
              aria-label={img.label}
            >
              <Image src={img.src} alt="" fill sizes="80px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/95" role="dialog" aria-modal="true" aria-label={cur.label}>
          <button onClick={() => setZoom(false)} className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Sluiten">
            <X className="size-5" />
          </button>
          <div className="relative h-[85vh] w-[92vw]" onTouchStart={(e) => setTouchX(e.touches[0].clientX)} onTouchEnd={(e) => onTouchEnd(e.changedTouches[0].clientX)}>
            <Image src={cur.src} alt={`${name} — ${cur.label}`} fill sizes="92vw" className="object-contain" />
          </div>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-white/80">
            {cur.label} · {i + 1}/{n}
          </p>
          {n > 1 && (
            <>
              <button onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Vorige">
                <ChevronLeft className="size-6" />
              </button>
              <button onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Volgende">
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
