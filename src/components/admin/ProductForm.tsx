"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteProduct, saveProduct, type ProductInput } from "@/app/admin/actions";
import { DEFAULT_SIZE_CHART, DEFAULT_SIZES, KIDS_SIZES } from "@/lib/config";
import { slugify } from "@/lib/format";
import type { Product, SizeChart } from "@/lib/types";
import { ImageUpload, uploadImage } from "./ImageUpload";
import { Switch } from "./Switch";

type V = { id?: string; size: string; stock: string; is_active: boolean };

const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
};
const euro = (cents: number | null | undefined) => (cents == null ? "" : (cents / 100).toFixed(2).replace(".", ","));
const toCents = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
};

const MATERIAL_PRESET = "100% gekamd katoen, 180 g/m²\nZachte, stevige kwaliteit die mooi blijft na het wassen.";
const FIT_PRESET = "Regular fit — valt normaal. Tussen twee maten? Kies de grotere maat.";
const CARE_PRESET = "Binnenstebuiten wassen op max. 30 °C. Niet in de droger. Niet strijken op de print.";

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const editing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(editing);
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(euro(product?.price_cents) || "25,00");
  const [compare, setCompare] = useState(euro(product?.compare_at_cents));
  const [front, setFront] = useState<string | null>(product?.image_front ?? null);
  const [back, setBack] = useState<string | null>(product?.image_back ?? null);
  const [extras, setExtras] = useState<string[]>(product?.extra_images ?? []);
  const [material, setMaterial] = useState(product?.material ?? (editing ? "" : MATERIAL_PRESET));
  const [fit, setFit] = useState(product?.fit ?? (editing ? "" : FIT_PRESET));
  const [care, setCare] = useState(product?.care ?? (editing ? "" : CARE_PRESET));
  const [chart, setChart] = useState<SizeChart>(product?.size_chart ?? DEFAULT_SIZE_CHART);
  const [deliveryNote, setDeliveryNote] = useState(product?.delivery_note ?? "");
  const [until, setUntil] = useState(toLocalInput(product?.available_until ?? null));
  const [active, setActive] = useState(product?.is_active ?? false);
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [sort, setSort] = useState(String(product?.sort_order ?? 0));
  const [variants, setVariants] = useState<V[]>(
    product?.product_variants.map((v) => ({ id: v.id, size: v.size, stock: v.stock == null ? "" : String(v.stock), is_active: v.is_active })) ??
      ["S", "M", "L", "XL", "XXL"].map((size) => ({ size, stock: "", is_active: true })),
  );
  const [newSize, setNewSize] = useState("");
  const [extraBusy, setExtraBusy] = useState(false);

  const has = (size: string) => variants.some((v) => v.size === size);
  const toggleSize = (size: string) =>
    setVariants((vs) => (has(size) ? vs.filter((v) => v.size !== size) : [...vs, { size, stock: "", is_active: true }]));
  const addPreset = (sizes: string[]) =>
    setVariants((vs) => [...vs, ...sizes.filter((s) => !vs.some((v) => v.size === s)).map((size) => ({ size, stock: "", is_active: true }))]);
  const orderedAll = [...DEFAULT_SIZES, ...KIDS_SIZES];
  const sortVariants = () =>
    setVariants((vs) =>
      [...vs].sort((a, b) => {
        const ia = orderedAll.indexOf(a.size), ib = orderedAll.indexOf(b.size);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      }),
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const price_cents = toCents(price);
    if (!Number.isFinite(price_cents) || price_cents <= 0) return toast.error("Vul een geldige prijs in");
    if (!front) return toast.error("Upload minimaal de voorkant");
    const compare_at_cents = compare ? toCents(compare) : null;
    const payload: ProductInput = {
      id: product?.id,
      name,
      slug: slugTouched ? slug : slugify(name),
      subtitle: subtitle || null,
      description: description || null,
      price_cents,
      compare_at_cents: compare_at_cents && Number.isFinite(compare_at_cents) ? compare_at_cents : null,
      image_front: front,
      image_back: back,
      extra_images: extras,
      material: material || null,
      fit: fit || null,
      care: care || null,
      size_chart: chart.rows.length ? chart : null,
      delivery_note: deliveryNote || null,
      available_until: until ? new Date(until).toISOString() : null,
      is_active: active,
      featured,
      sort_order: Number(sort) || 0,
      variants: variants.map((v) => ({
        id: v.id,
        size: v.size.trim(),
        stock: v.stock.trim() === "" ? null : Math.max(0, parseInt(v.stock, 10) || 0),
        is_active: v.is_active,
      })),
    };
    start(async () => {
      const r = await saveProduct(payload);
      if (!r.ok) return void toast.error("Opslaan mislukt", { description: r.error });
      toast.success(editing ? "Wijzigingen opgeslagen" : "Shirt aangemaakt", {
        description: active ? "Staat online in de shop." : "Staat nog offline — zet hem online als je klaar bent.",
      });
      if (!editing) router.replace(`/admin/producten/${r.id}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!product) return;
    if (!confirm(`"${product.name}" definitief verwijderen? Tip: offline zetten kan ook.`)) return;
    start(async () => {
      const r = await deleteProduct(product.id);
      if (r.ok) {
        toast.success("Shirt verwijderd");
        router.replace("/admin/producten");
      } else toast.error(r.error);
    });
  };

  const addExtra = async (file?: File | null) => {
    if (!file) return;
    setExtraBusy(true);
    try {
      const url = await uploadImage(file);
      setExtras((x) => [...x, url]);
      toast.success("Detailfoto toegevoegd");
    } catch (e) {
      toast.error("Upload mislukt", { description: (e as Error).message });
    } finally {
      setExtraBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6 pb-24">
      {/* Basis */}
      <Card title="Basis">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Naam *">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Supportersshirt 2026/27" />
          </Field>
          <Field label="URL" hint={`5321938.nl/shirt/${slugTouched ? slug : slugify(name) || "…"}`}>
            <input className="input" value={slugTouched ? slug : slugify(name)} onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }} />
          </Field>
          <Field label="Ondertitel" className="sm:col-span-2">
            <input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Zwart met rode print · limited edition" />
          </Field>
          <Field label="Prijs (€, incl. btw) *">
            <input className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </Field>
          <Field label="Van-prijs (optioneel, doorgestreept)">
            <input className="input" inputMode="decimal" value={compare} onChange={(e) => setCompare(e.target.value)} placeholder="bv. 29,95" />
          </Field>
          <Field label="Beschrijving" className="sm:col-span-2">
            <textarea className="input min-h-28" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vertel waarom dit shirt bijzonder is…" />
          </Field>
        </div>
      </Card>

      {/* Foto's */}
      <Card title="Foto's" sub="Tip: gebruik vierkante foto's (bv. 1600×1600) met lichte of transparante achtergrond — PNG of JPG.">
        <div className="grid gap-4 sm:grid-cols-3">
          <ImageUpload label="Voorkant" required value={front} onChange={setFront} hint="Wordt ook gebruikt bij delen op social media" />
          <ImageUpload label="Achterkant" value={back} onChange={setBack} />
          <div>
            <p className="label">Detailfoto&apos;s</p>
            <div className="grid grid-cols-2 gap-2">
              {extras.map((u) => (
                <div key={u} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="size-full object-contain" />
                  <button type="button" onClick={() => setExtras((x) => x.filter((y) => y !== u))} className="absolute right-1 top-1 rounded-full bg-white p-1 shadow" aria-label="Verwijder">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {extras.length < 8 && (
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-sm text-zinc-500 hover:border-ink">
                  {extraBusy ? "…" : <Plus className="size-5" />}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => addExtra(e.target.files?.[0])} />
                </label>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Maten */}
      <Card title="Maten & voorraad" sub="Laat voorraad leeg voor onbeperkt (print on demand). Vul een getal in om te stoppen bij 0.">
        <div className="flex flex-wrap gap-2">
          {orderedAll.map((s) => (
            <button key={s} type="button" onClick={() => toggleSize(s)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${has(s) ? "border-ink bg-ink text-white" : "border-zinc-300 hover:border-ink"}`}>
              {s}
            </button>
          ))}
          <button type="button" onClick={() => addPreset(DEFAULT_SIZES)} className="rounded-full px-3 py-1.5 text-sm font-medium underline">+ alle volwassenen</button>
          <button type="button" onClick={() => addPreset(KIDS_SIZES)} className="rounded-full px-3 py-1.5 text-sm font-medium underline">+ alle kids</button>
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input max-w-40" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Eigen maat, bv. 5XL" />
          <button type="button" className="btn-ghost px-4 py-2 text-sm" onClick={() => { if (newSize.trim() && !has(newSize.trim())) { setVariants((v) => [...v, { size: newSize.trim(), stock: "", is_active: true }]); setNewSize(""); } }}>
            Toevoegen
          </button>
          <button type="button" className="px-3 text-sm text-zinc-500 underline" onClick={sortVariants}>Sorteer</button>
        </div>
        {variants.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-zinc-500">
                <tr><th className="px-4 py-2 font-medium">Maat</th><th className="px-4 py-2 font-medium">Voorraad</th><th className="px-4 py-2 font-medium">Actief</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {variants.map((v, i) => (
                  <tr key={v.size}>
                    <td className="px-4 py-2 font-semibold">{v.size}</td>
                    <td className="px-4 py-2">
                      <input className="input w-28 py-1.5" inputMode="numeric" placeholder="onbeperkt" value={v.stock}
                        onChange={(e) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, stock: e.target.value.replace(/\D/g, "") } : x)))} />
                    </td>
                    <td className="px-4 py-2">
                      <Switch checked={v.is_active} label={`Maat ${v.size} actief`} onChange={(c) => setVariants((vs) => vs.map((x, j) => (j === i ? { ...x, is_active: c } : x)))} />
                    </td>
                    <td className="px-2 text-right">
                      <button type="button" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-ink" aria-label="Verwijder maat"><Trash2 className="size-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Materiaal */}
      <Card title="Materiaal, pasvorm & onderhoud">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Materiaal"><textarea className="input min-h-28" value={material} onChange={(e) => setMaterial(e.target.value)} /></Field>
          <Field label="Pasvorm"><textarea className="input min-h-28" value={fit} onChange={(e) => setFit(e.target.value)} /></Field>
          <Field label="Wasvoorschrift"><textarea className="input min-h-28" value={care} onChange={(e) => setCare(e.target.value)} /></Field>
        </div>
      </Card>

      {/* Maattabel */}
      <Card title="Maattabel" sub="Wordt op de productpagina en /maattabel getoond.">
        <SizeChartEditor chart={chart} onChange={setChart} sizes={variants.map((v) => v.size)} />
      </Card>

      {/* Verkoop */}
      <Card title="Verkoop">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bestellen kan tot (optioneel)" hint="Toont een aftelklok; daarna niet meer te bestellen.">
            <input type="datetime-local" className="input" value={until} onChange={(e) => setUntil(e.target.value)} />
          </Field>
          <Field label="Levertekst (optioneel)" hint='Bijv. "Geleverd vóór de thuiswedstrijd van 12 okt"'>
            <input className="input" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} />
          </Field>
          <Field label="Volgorde" hint="Lager = eerder getoond">
            <input className="input w-28" inputMode="numeric" value={sort} onChange={(e) => setSort(e.target.value)} />
          </Field>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-3 text-sm font-medium"><Switch checked={featured} onChange={setFeatured} label="Uitgelicht" /> Uitgelicht op de homepage (hero)</label>
          </div>
        </div>
      </Card>

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <label className="flex items-center gap-3 text-sm font-semibold">
            <Switch checked={active} onChange={setActive} label="Online" />
            <span className={active ? "text-emerald-700" : "text-zinc-500"}>{active ? "Online in de shop" : "Offline"}</span>
          </label>
          <div className="ml-auto flex items-center gap-2">
            {editing && (
              <button type="button" onClick={remove} disabled={pending} className="rounded-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">Verwijderen</button>
            )}
            <button type="submit" disabled={pending} className="btn-dark px-6 py-2.5 text-sm">{pending ? "Opslaan…" : "Opslaan"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-zinc-500">{sub}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

function SizeChartEditor({ chart, onChange, sizes }: { chart: SizeChart; onChange: (c: SizeChart) => void; sizes: string[] }) {
  const setCell = (r: number, c: number, v: string) =>
    onChange({ ...chart, rows: chart.rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });
  const setCol = (c: number, v: string) => onChange({ ...chart, columns: chart.columns.map((x, j) => (j === c ? v : x)) });
  const syncSizes = () =>
    onChange({
      ...chart,
      rows: sizes.map((s) => chart.rows.find((r) => r[0] === s) ?? [s, ...chart.columns.slice(1).map(() => "")]),
    });
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              {chart.columns.map((c, j) => (
                <th key={j} className="p-1">
                  <input className="input min-w-32 py-1.5 font-semibold" value={c} onChange={(e) => setCol(j, e.target.value)} />
                </th>
              ))}
              <th className="p-1">
                <button type="button" className="rounded-full p-2 hover:bg-zinc-100" title="Kolom toevoegen"
                  onClick={() => onChange({ columns: [...chart.columns, "Nieuwe kolom"], rows: chart.rows.map((r) => [...r, ""]), note: chart.note })}>
                  <Plus className="size-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="p-1"><input className="input py-1.5" value={cell} onChange={(e) => setCell(i, j, e.target.value)} /></td>
                ))}
                <td className="p-1">
                  <button type="button" className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100" onClick={() => onChange({ ...chart, rows: chart.rows.filter((_, k) => k !== i) })} aria-label="Rij verwijderen">
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <button type="button" className="underline" onClick={() => onChange({ ...chart, rows: [...chart.rows, chart.columns.map(() => "")] })}>+ Rij</button>
        <button type="button" className="underline" onClick={syncSizes}>Rijen gelijk aan gekozen maten</button>
        {chart.columns.length > 2 && (
          <button type="button" className="underline" onClick={() => onChange({ columns: chart.columns.slice(0, -1), rows: chart.rows.map((r) => r.slice(0, -1)), note: chart.note })}>− Laatste kolom</button>
        )}
      </div>
      <label className="mt-4 block">
        <span className="label">Toelichting onder de tabel</span>
        <input className="input" value={chart.note ?? ""} onChange={(e) => onChange({ ...chart, note: e.target.value })} />
      </label>
    </div>
  );
}
