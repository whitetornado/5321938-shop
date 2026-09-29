"use client";
import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 25,
  size = "md",
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
}) {
  const s = size === "sm" ? "size-8" : "size-10";
  return (
    <div className="inline-flex items-center rounded-full border border-zinc-300 bg-white" role="group" aria-label={label ?? "Aantal"}>
      <button
        type="button"
        className={`${s} inline-flex items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 disabled:opacity-30`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Minder"
      >
        <Minus className="size-4" />
      </button>
      <span className={`${size === "sm" ? "w-6 text-sm" : "w-8"} text-center font-semibold tabular-nums`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className={`${s} inline-flex items-center justify-center rounded-full text-zinc-700 hover:bg-zinc-100 disabled:opacity-30`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Meer"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
