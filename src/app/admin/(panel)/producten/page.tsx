import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { adminGetProducts, isAvailable } from "@/lib/products";
import { money } from "@/lib/format";
import { ProductRowActions } from "@/components/admin/ProductRowActions";

export default async function ProductsAdmin() {
  const products = await adminGetProducts();
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shirts</h1>
        <Link href="/admin/producten/nieuw" className="btn-dark px-4 py-2.5 text-sm">
          <Plus className="size-4" /> Nieuw shirt
        </Link>
      </div>
      {products.length === 0 ? (
        <div className="card mt-6 p-10 text-center">
          <p className="font-semibold">Nog geen shirts</p>
          <p className="mt-1 text-sm text-zinc-500">Voeg je eerste shirt toe met een voor- en achterkant-foto.</p>
          <Link href="/admin/producten/nieuw" className="btn-primary mt-5">Shirt toevoegen</Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {products.map((p) => {
            const stock = p.product_variants.filter((v) => v.is_active);
            const tracked = stock.some((v) => v.stock !== null);
            const expired = p.is_active && !isAvailable(p);
            return (
              <li key={p.id} className="card flex flex-wrap items-center gap-4 p-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {p.image_front && <Image src={p.image_front} alt="" fill sizes="64px" className="object-contain" />}
                </div>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/producten/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                  <p className="text-sm text-zinc-500">
                    {money(p.price_cents)} · {stock.map((v) => (tracked && v.stock !== null ? `${v.size} (${v.stock})` : v.size)).join(", ")}
                  </p>
                  {expired && <p className="text-xs font-medium text-amber-600">Bestelperiode verlopen — niet meer te bestellen</p>}
                </div>
                <ProductRowActions id={p.id} slug={p.slug} isActive={p.is_active} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
