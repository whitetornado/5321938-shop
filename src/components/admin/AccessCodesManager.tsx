"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createAccessCodes, deleteAccessCode, updateAccessCode } from "@/app/admin/actions";
import type { AccessCode } from "@/lib/access";
import { dateTimeNL } from "@/lib/format";
import { Switch } from "./Switch";

export function AccessCodesManager({ codes, siteUrl }: { codes: AccessCode[]; siteUrl: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [names, setNames] = useState("");
  const [count, setCount] = useState("10");
  const [prefix, setPrefix] = useState("GHC");
  const [maxUses, setMaxUses] = useState("");
  const [custom, setCustom] = useState("");
  const [q, setQ] = useState("");

  const shopHost = siteUrl.replace(/^https?:\/\//, "");
  const message = (c: AccessCode) =>
    `${c.label ? `Hoi ${c.label}, ` : ""}je persoonlijke code voor de shop: ${c.code}\nBestellen via ${shopHost} — deel deze code niet.`;

  const copy = async (text: string, what = "Gekopieerd") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(what);
    } catch {
      toast.error("Kopiëren lukte niet");
    }
  };

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message ?? "Gelukt");
      else toast.error(r.error ?? "Mislukt");
      router.refresh();
    });

  const create = () => {
    const labels = names.split("\n").map((s) => s.trim()).filter(Boolean);
    run(() =>
      createAccessCodes({
        labels,
        count: labels.length ? undefined : Number(count) || 1,
        prefix,
        customCode: custom || undefined,
        maxUses: maxUses ? Number(maxUses) : null,
      }),
    );
    setNames("");
    setCustom("");
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? codes.filter((c) => c.code.toLowerCase().includes(t) || (c.label ?? "").toLowerCase().includes(t)) : codes;
  }, [codes, q]);

  const activeCount = codes.filter((c) => c.is_active).length;

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="font-semibold">Codes aanmaken</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block sm:row-span-2">
            <span className="label">Namen (één per regel) — elke naam krijgt een eigen code</span>
            <textarea className="input min-h-36" value={names} onChange={(e) => setNames(e.target.value)} placeholder={"Jan\nPiet\nKees"} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="label">Of: aantal (zonder namen)</span>
              <input className="input" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, ""))} disabled={!!names.trim()} />
            </label>
            <label className="block">
              <span className="label">Voorvoegsel</span>
              <input className="input uppercase" value={prefix} onChange={(e) => setPrefix(e.target.value)} maxLength={8} />
            </label>
            <label className="block">
              <span className="label">Max. bestellingen per code</span>
              <input className="input" inputMode="numeric" placeholder="onbeperkt" value={maxUses} onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, ""))} />
            </label>
            <label className="block">
              <span className="label">Eigen code (optioneel, 1 stuk)</span>
              <input className="input uppercase" value={custom} onChange={(e) => setCustom(e.target.value)} disabled={names.split("\n").filter((s) => s.trim()).length > 1} placeholder="bv. FIRM2026" />
            </label>
          </div>
          <div className="flex items-end">
            <button onClick={create} disabled={pending} className="btn-dark w-full py-2.5 text-sm">
              {pending ? "Bezig…" : "Codes aanmaken"}
            </button>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 p-4">
          <p className="text-sm text-zinc-500">
            {codes.length} codes · {activeCount} actief · {codes.reduce((s, c) => s + c.uses, 0)} bestellingen
          </p>
          <input className="input ml-auto w-56 py-2 text-sm" placeholder="Zoek naam of code" value={q} onChange={(e) => setQ(e.target.value)} />
          <button
            className="btn-ghost px-4 py-2 text-sm"
            onClick={() => copy(filtered.filter((c) => c.is_active).map((c) => `${c.label ?? "—"}\t${c.code}`).join("\n"), "Lijst gekopieerd")}
          >
            <Copy className="size-4" /> Kopieer lijst
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Naam</th>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Besteld</th>
                <th className="px-4 py-2.5 font-medium">Laatst ingelogd</th>
                <th className="px-4 py-2.5 font-medium">Actief</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((c) => (
                <tr key={c.id} className={c.is_active ? "" : "bg-zinc-50 text-zinc-400"}>
                  <td className="px-4 py-2.5">
                    <input
                      className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 hover:border-zinc-200 focus:border-ink focus:outline-none"
                      defaultValue={c.label ?? ""}
                      placeholder="—"
                      onBlur={(e) => e.target.value !== (c.label ?? "") && run(() => updateAccessCode(c.id, { label: e.target.value || null }))}
                    />
                  </td>
                  <td className="px-4 py-2.5 font-mono font-semibold tracking-wider">{c.code}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {c.uses}
                    {c.max_uses !== null && <span className="text-zinc-400"> / {c.max_uses}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-zinc-500">{c.last_used_at ? dateTimeNL(c.last_used_at) : "nog niet"}</td>
                  <td className="px-4 py-2.5">
                    <Switch checked={c.is_active} label={`Code ${c.code} actief`} disabled={pending} onChange={(v) => run(() => updateAccessCode(c.id, { is_active: v }))} />
                  </td>
                  <td className="px-2 py-2.5 text-right whitespace-nowrap">
                    <button className="rounded-full p-2 hover:bg-zinc-100" title="Kopieer WhatsApp-bericht" onClick={() => copy(message(c), "Bericht gekopieerd — plak in WhatsApp")}>
                      <Copy className="size-4" />
                    </button>
                    <button
                      className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                      title="Verwijderen"
                      onClick={() => confirm(`Code ${c.code} verwijderen?`) && run(() => deleteAccessCode(c.id))}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">Nog geen codes.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
