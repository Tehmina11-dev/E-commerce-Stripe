import Link from "next/link";
import type { Product } from "@/lib/types";
import { pseudoRating } from "@/lib/rating";
import { Stars } from "@/components/ui/Stars";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "@/components/ui/ProductImage";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  const { stars, reviews } = pseudoRating(product.id);
  const lowStock = product.stock > 0 && product.stock <= 10;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link
        href={`/product/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-zinc-50"
      >
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {lowStock && (
          <span className="absolute left-3 top-3 rounded-full bg-rose-600/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
            Only {product.stock} left
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="line-clamp-2 text-sm font-medium text-ink transition group-hover:text-gold-700">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Stars rating={stars} />
          <span className="font-medium text-zinc-700">{stars.toFixed(1)}</span>
          <span>({reviews.toLocaleString()})</span>
        </div>

        <div className="mt-1 flex items-end justify-between">
          <Price cents={product.price} currency={product.currency} size="md" />
          <span className="text-[11px] font-medium uppercase tracking-wide text-teal">
            Prime
          </span>
        </div>

        <p className="text-[11px] text-zinc-500">
          FREE delivery <span className="font-semibold text-ink">Tomorrow</span>
        </p>

        <div className="mt-auto pt-2">
          <AddToCartButton product={product} full />
        </div>
      </div>
    </div>
  );
}
