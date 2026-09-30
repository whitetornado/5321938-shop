"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Ververst de statuspagina elke paar seconden zolang de betaling nog verwerkt wordt. */
export function StatusRefresher({ everyMs = 4000, maxTries = 30 }: { everyMs?: number; maxTries?: number }) {
  const router = useRouter();
  useEffect(() => {
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (n > maxTries) return clearInterval(t);
      router.refresh();
    }, everyMs);
    return () => clearInterval(t);
  }, [router, everyMs, maxTries]);
  return null;
}
