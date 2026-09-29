"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createUploadUrl } from "@/app/admin/actions";
import { supabaseBrowser } from "@/lib/supabase-browser";

const BUCKET = "product-images";
const MAX = 2000;

/** Verkleint naar max 2000px. PNG blijft PNG (transparantie), de rest wordt JPEG. */
async function prepare(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file).catch(() => null);
  if (!bmp) return file;
  const scale = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  if (scale === 1 && file.size < 1.5 * 1024 * 1024 && file.type !== "image/webp") return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext("2d")!;
  const png = file.type === "image/png";
  if (!png) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res) =>
    canvas.toBlob((b) => res(b ?? file), png ? "image/png" : "image/jpeg", 0.88),
  );
}

export async function uploadImage(file: File): Promise<string> {
  const blob = await prepare(file);
  const type = blob.type || file.type;
  const r = await createUploadUrl(file.name, type);
  if (!r.ok) throw new Error(r.error);
  const { error } = await supabaseBrowser().storage.from(BUCKET).uploadToSignedUrl(r.path, r.token, blob, { contentType: type });
  if (error) throw new Error(error.message);
  return r.publicUrl;
}

export function ImageUpload({
  label,
  hint,
  value,
  onChange,
  required,
}: {
  label: string;
  hint?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const handle = async (file?: File | null) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return toast.error("Gebruik PNG, JPG of WebP");
    setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
      toast.success(`${label} geüpload`);
    } catch (e) {
      toast.error("Upload mislukt", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="label">
        {label} {required && <span className="text-brand">*</span>}
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition ${drag ? "border-brand bg-brand/5" : "border-zinc-300 bg-white"}`}
      >
        {value ? (
          <>
            <Image src={value} alt={label} fill sizes="300px" className="object-contain p-2" />
            <div className="absolute right-2 top-2 flex gap-1">
              <button type="button" onClick={() => input.current?.click()} className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold shadow">Vervang</button>
              <button type="button" onClick={() => onChange(null)} className="rounded-full bg-white/95 p-1.5 shadow" aria-label="Verwijder"><X className="size-4" /></button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => input.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-zinc-500">
            {busy ? <Loader2 className="size-7 animate-spin" /> : <ImagePlus className="size-7" />}
            <span className="font-medium">{busy ? "Uploaden…" : "Klik of sleep een foto"}</span>
            {hint && <span className="px-4 text-center text-xs text-zinc-400">{hint}</span>}
          </button>
        )}
        {busy && value && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="size-7 animate-spin" /></div>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handle(e.target.files?.[0])} />
    </div>
  );
}
