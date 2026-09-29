import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { isAvailable, isSoldOut } from "@/lib/products";
import { FlipImage } from "./FlipImage";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const soldOut = isSoldOut(product);
  const closed = !isAvailable(product);
  const sizes = product.product_variants.filter((v) => v.is_active).map((v) => v.size);
  return (
    <Link href={`/shirt/${product.slug}`} className="group block">
      <div className="relative">
        <FlipImage
          front={product.image_front}
          back={product.image_back}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          showToggle={false}
        />
        {(soldOut || closed) && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
            {soldOut ? "Uitverkocht" : "Gesloten"}
          </span>
        )}
        {!soldOut && !closed && product.compare_at_cents && product.compare_at_cents > product.price_cents && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">Actie</span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold group-hover:underline">{product.name}</h3>
          {product.subtitle && <p className="text-sm text-zinc-500">{product.subtitle}</p>}
          <p className="mt-1 text-xs text-zinc-400">{sizes.join(" · ")}</p>
        </div>
        <p className="shrink-0 font-bold tabular-nums">
          {product.compare_at_cents && product.compare_at_cents > product.price_cents && (
            <span className="mr-1.5 text-sm font-normal text-zinc-400 line-through">{money(product.compare_at_cents)}</span>
          )}
          {money(product.price_cents)}
        </p>
      </div>
    </Link>
  );
}
