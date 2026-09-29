"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Copy, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";
import { duplicateProduct, toggleProduct } from "@/app/admin/actions";
import { Switch } from "./Switch";

export function ProductRowActions({ id, slug, isActive }: { id: string; slug: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [pending, start] = useTransition();
  const router = useRouter();

  const toggle = (v: boolean) => {
    setActive(v);
    start(async () => {
      const r = await toggleProduct(id, v);
      if (r.ok) toast.success(r.message);
      else {
        setActive(!v);
        toast.error(r.error);
      }
    });
  };

  const dup = () =>
    start(async () => {
      const r = await duplicateProduct(id);
      if (r.ok) {
        toast.success(r.message);
        router.push(`/admin/producten/${r.id}`);
      } else toast.error(r.error);
    });

  return (
    <div className="flex items-center gap-1">
      <label className="mr-2 flex items-center gap-2 text-sm font-medium">
        <Switch checked={active} onChange={toggle} disabled={pending} label="Online" />
        <span className={active ? "text-emerald-700" : "text-zinc-400"}>{active ? "Online" : "Offline"}</span>
      </label>
      <Link href={`/admin/producten/${id}`} className="rounded-full p-2 hover:bg-zinc-100" title="Bewerken"><Pencil className="size-4" /></Link>
      <button onClick={dup} disabled={pending} className="rounded-full p-2 hover:bg-zinc-100" title="Dupliceren"><Copy className="size-4" /></button>
      {active && (
        <a href={`/shirt/${slug}`} target="_blank" className="rounded-full p-2 hover:bg-zinc-100" title="Bekijk in shop"><ExternalLink className="size-4" /></a>
      )}
    </div>
  );
}
