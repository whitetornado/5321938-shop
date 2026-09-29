"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ until, prefix = "Bestellen kan nog", className = "" }: { until: string; prefix?: string; className?: string }) {
  const target = new Date(until).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return <span className={className}>&nbsp;</span>;
  const left = target - now;
  if (left <= 0) return <span className={className}>Bestellen is gesloten</span>;
  const p = parts(left);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}>
      <Clock className="size-4" />
      {prefix}{" "}
      <strong>
        {p.d > 0 && `${p.d}d `}
        {pad(p.h)}:{pad(p.m)}:{pad(p.s)}
      </strong>
    </span>
  );
}
