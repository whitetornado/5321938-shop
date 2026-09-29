import Link from "next/link";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProduct() {
  return (
    <div>
      <Link href="/admin/producten" className="text-sm text-zinc-500 hover:text-ink">← Shirts</Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">Nieuw shirt</h1>
      <ProductForm />
    </div>
  );
}
