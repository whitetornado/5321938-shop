import Link from "next/link";
import { notFound } from "next/navigation";
import { adminGetProduct } from "@/lib/products";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await adminGetProduct(id);
  if (!product) notFound();
  return (
    <div>
      <Link href="/admin/producten" className="text-sm text-zinc-500 hover:text-ink">← Shirts</Link>
      <div className="mb-6 mt-1 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        {product.is_active && <a href={`/shirt/${product.slug}`} target="_blank" className="text-sm font-medium underline">Bekijk in shop ↗</a>}
      </div>
      <ProductForm key={product.updated_at} product={product} />
    </div>
  );
}
