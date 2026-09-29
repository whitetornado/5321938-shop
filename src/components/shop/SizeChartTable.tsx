import type { SizeChart } from "@/lib/types";

export function SizeChartTable({ chart }: { chart: SizeChart }) {
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              {chart.columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-4 py-2.5 text-left font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {chart.rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) =>
                  j === 0 ? (
                    <th key={j} scope="row" className="px-4 py-2.5 text-left font-semibold">{cell}</th>
                  ) : (
                    <td key={j} className="px-4 py-2.5 tabular-nums text-zinc-700">{cell}</td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chart.note && <p className="mt-2 text-xs text-zinc-500">{chart.note}</p>}
    </div>
  );
}

export function HowToMeasure() {
  return (
    <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
      <svg viewBox="0 0 120 120" className="w-28 text-zinc-300" aria-hidden>
        <path d="M38 14 L20 22 L6 44 L22 54 L30 44 L30 110 L90 110 L90 44 L98 54 L114 44 L100 22 L82 14 C78 24 70 28 60 28 C50 28 42 24 38 14Z" fill="currentColor" />
        <line x1="30" y1="50" x2="90" y2="50" stroke="var(--brand)" strokeWidth="2.5" strokeDasharray="4 3" />
        <line x1="104" y1="18" x2="104" y2="110" stroke="#0a0a0a" strokeWidth="2" strokeDasharray="4 3" />
        <text x="60" y="46" textAnchor="middle" fontSize="9" fill="var(--brand)" fontWeight="700">A</text>
        <text x="110" y="68" fontSize="9" fill="#0a0a0a" fontWeight="700">B</text>
      </svg>
      <ul className="space-y-2 text-sm text-zinc-600">
        <li><strong className="text-ink">A · Borstbreedte:</strong> leg een goed passend shirt plat neer en meet recht van oksel tot oksel.</li>
        <li><strong className="text-ink">B · Lengte:</strong> meet van het hoogste punt van de schouder tot de onderkant.</li>
        <li>Tussen twee maten in? Kies de grotere maat voor een relaxte pasvorm.</li>
      </ul>
    </div>
  );
}
