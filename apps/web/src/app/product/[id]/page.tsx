import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { getProduct } from "@/lib/api";
import { pseudoRating } from "@/lib/rating";
import { Stars } from "@/components/ui/Stars";
import { Price } from "@/components/ui/Price";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  return { title: product ? `${product.name} — Luxmart` : "Product — Luxmart" };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const { stars, reviews } = pseudoRating(product.id);
  const inStock = product.stock > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-xs text-zinc-500">
        <Link href="/" className="hover:text-gold-700">
          Home
        </Link>
        <ChevronRight size={14} />
        <span className="truncate font-medium text-zinc-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_320px]">
        {/* Gallery */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <div className="aspect-square">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 text-sm">
            <Stars rating={stars} size={16} />
            <span className="font-medium text-zinc-700">{stars.toFixed(1)}</span>
            <span className="text-gold-700">
              {reviews.toLocaleString()} ratings
            </span>
          </div>

          <hr className="border-zinc-200" />

          <Price cents={product.price} currency={product.currency} size="lg" />
          <p className="text-xs text-zinc-500">
            Inclusive of all taxes · FREE Prime delivery
          </p>

          {product.description && (
            <div className="pt-2">
              <h2 className="mb-1 text-sm font-bold text-ink">
                About this item
              </h2>
              <p className="text-sm leading-relaxed text-zinc-600">
                {product.description}
              </p>
            </div>
          )}

          <ul className="grid gap-2 pt-2 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <Truck size={16} className="text-teal" /> Fast, free delivery
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-teal" /> Secure Stripe payment
            </li>
            <li className="flex items-center gap-2">
              <RotateCcw size={16} className="text-teal" /> 30-day easy returns
            </li>
          </ul>
        </div>

        {/* Buy box */}
        <aside className="h-fit space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card lg:sticky lg:top-28">
          <Price cents={product.price} currency={product.currency} size="md" />
          <p
            className={`text-lg font-semibold ${
              inStock ? "text-teal" : "text-rose-600"
            }`}
          >
            {inStock ? "In stock" : "Currently unavailable"}
          </p>
          {inStock && product.stock <= 10 && (
            <p className="text-sm font-medium text-rose-600">
              Only {product.stock} left — order soon.
            </p>
          )}
          <p className="text-xs text-zinc-500">
            Ships from and sold by <span className="font-semibold">Luxmart</span>
          </p>

          <div className="pt-2">
            <ProductPurchasePanel product={product} />
          </div>
        </aside>
      </div>
    </div>
  );
}
