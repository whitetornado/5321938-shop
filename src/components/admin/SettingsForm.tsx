"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettings } from "@/app/admin/actions";
import type { Settings } from "@/lib/types";
import { Switch } from "./Switch";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [s, setS] = useState(settings);
  const [pending, start] = useTransition();
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((x) => ({ ...x, [k]: v }));
  return (
    <form
      className="card space-y-5 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveSettings({
            shop_open: s.shop_open,
            closed_message: s.closed_message,
            announcement: s.announcement,
            hero_title: s.hero_title,
            hero_subtitle: s.hero_subtitle,
          });
          if (r.ok) toast.success(r.message);
          else toast.error(r.error);
        });
      }}
    >
      <label className="flex items-center gap-3 font-semibold">
        <Switch checked={s.shop_open} onChange={(v) => set("shop_open", v)} label="Shop open" />
        {s.shop_open ? "Shop is open — er kan besteld worden" : "Shop is gesloten — afrekenen uitgeschakeld"}
      </label>
      <label className="block">
        <span className="label">Melding als de shop gesloten is</span>
        <input className="input" value={s.closed_message ?? ""} onChange={(e) => set("closed_message", e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Aankondigingsbalk (bovenaan, leeg = verborgen)</span>
        <input className="input" value={s.announcement ?? ""} onChange={(e) => set("announcement", e.target.value)} placeholder="Bestel vóór vrijdag 23:59 = binnen vóór de wedstrijd ⚽" />
      </label>
      <label className="block">
        <span className="label">Homepage titel</span>
        <input className="input" value={s.hero_title ?? ""} onChange={(e) => set("hero_title", e.target.value)} />
      </label>
      <label className="block">
        <span className="label">Homepage subtitel</span>
        <textarea className="input min-h-20" value={s.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} />
      </label>
      <button disabled={pending} className="btn-dark">{pending ? "Opslaan…" : "Opslaan"}</button>
    </form>
  );
}
