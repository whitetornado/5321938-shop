"use client";
import Image from "next/image";
import { useState } from "react";

/** Toont voorkant; wisselt naar achterkant bij hover (desktop) of tik op de toggle. */
export function FlipImage({
  front,
  back,
  alt,
  priority,
  sizes,
  showToggle = true,
}: {
  front: string | null;
  back: string | null;
  alt: string;
  priority?: boolean;
  sizes: string;
  showToggle?: boolean;
}) {
  const [side, setSide] = useState<"front" | "back">("front");
  const hasBack = Boolean(back);
  return (
    <div
      className="group relative aspect-square w-full overflow-hidden rounded-3xl bg-linear-to-b from-zinc-100 to-zinc-200/70"
      onMouseEnter={() => hasBack && setSide("back")}
      onMouseLeave={() => setSide("front")}
    >
      {front && (
        <Image
          src={front}
          alt={`${alt} — voorkant`}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-contain p-4 transition-all duration-500 ${side === "front" ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        />
      )}
      {back && (
        <Image
          src={back}
          alt={`${alt} — achterkant`}
          fill
          sizes={sizes}
          className={`object-contain p-4 transition-all duration-500 ${side === "back" ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        />
      )}
      {hasBack && showToggle && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-full bg-white/90 p-1 text-xs font-semibold shadow-sm backdrop-blur">
          {(["front", "back"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setSide(s);
              }}
              className={`rounded-full px-3 py-1.5 transition ${side === s ? "bg-ink text-white" : "text-zinc-600"}`}
              aria-pressed={side === s}
            >
              {s === "front" ? "Voor" : "Achter"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
