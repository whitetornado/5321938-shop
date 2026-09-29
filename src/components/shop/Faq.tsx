import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: React.ReactNode };

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
      {items.map((it) => (
        <details key={it.q} className="group px-5 py-1">
          <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-semibold">
            {it.q}
            <ChevronDown className="size-5 shrink-0 text-zinc-400 transition group-open:rotate-180" />
          </summary>
          <div className="pb-5 text-[15px] leading-relaxed text-zinc-600">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
