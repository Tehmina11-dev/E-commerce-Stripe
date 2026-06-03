"use client";

import Link from "next/link";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "@/components/ui/Price";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const { lines, subtotal, currency, count, setQuantity, removeItem, hydrated } =
    useCart();

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-zinc-200 bg-white p-10 shadow-card">
          <ShoppingCart size={44} className="text-zinc-300" />
          <h1 className="mt-4 text-xl font-bold text-ink">Your cart is empty</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Browse the catalog and add something you love.
          </p>
          <Link
            href="/"
            className="mt-6 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-600"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Shopping Cart
      </h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Items */}
        <div className="divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
          {lines.map((line) => (
            <div key={line.productId} className="flex gap-4 p-4">
              <Link
                href={`/product/${line.productId}`}
                className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-zinc-50"
              >
                <ProductImage
                  src={line.imageUrl}
                  alt={line.name}
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/product/${line.productId}`}
                  className="font-medium text-ink hover:text-gold-700"
                >
                  {line.name}
                </Link>
                <p className="mt-0.5 text-xs font-medium text-teal">In stock</p>

                <div className="mt-auto flex flex-wrap items-center gap-4 pt-3">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(q) => setQuantity(line.productId, q)}
                    max={Math.min(line.stock, 99)}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(line.productId)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 transition hover:text-rose-600"
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Price
                  cents={line.price * line.quantity}
                  currency={line.currency}
                  size="sm"
                />
                {line.quantity > 1 && (
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatPrice(line.price, line.currency)} each
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card lg:sticky lg:top-28">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-zinc-600">
              Subtotal ({count} {count === 1 ? "item" : "items"})
            </span>
            <Price cents={subtotal} currency={currency} size="sm" />
          </div>
          <p className="rounded-lg bg-teal/10 px-3 py-2 text-xs font-medium text-teal">
            Your order qualifies for FREE delivery.
          </p>
          <Link
            href="/checkout"
            className="block rounded-full bg-gold px-6 py-3 text-center text-sm font-bold text-ink shadow-sm transition hover:bg-gold-600 active:scale-[0.98]"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/"
            className="block text-center text-sm font-medium text-gold-700 hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
