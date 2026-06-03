"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { ProductImage } from "@/components/ui/ProductImage";
import { Price } from "@/components/ui/Price";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function CheckoutPage() {
  const { lines, subtotal, currency, count, clear, hydrated } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hydrated && lines.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-ink">Nothing to check out</h1>
        <p className="mt-1 text-sm text-zinc-500">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-600"
        >
          Browse products
        </Link>
      </div>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
          })),
          ...(email ? { customerEmail: email } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message ?? "Checkout failed. Please try again.";
        throw new Error(message);
      }

      const order = data as Order;
      clear();
      router.push(`/success?orderId=${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-ink">Checkout</h1>

      <form onSubmit={placeOrder} className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: details */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-ink">Contact details</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              We&apos;ll send your order confirmation here.
            </p>
            <label className="mt-4 block text-sm font-medium text-zinc-700">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm text-ink outline-none ring-gold transition focus:border-gold focus:ring-2"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-ink">
              Items ({count})
            </h2>
            <ul className="mt-4 divide-y divide-zinc-100">
              {lines.map((l) => (
                <li key={l.productId} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-50">
                    <ProductImage
                      src={l.imageUrl}
                      alt={l.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-ink">
                      {l.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Qty {l.quantity} · {formatPrice(l.price, l.currency)}
                    </p>
                  </div>
                  <Price
                    cents={l.price * l.quantity}
                    currency={l.currency}
                    size="sm"
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right: summary + place order */}
        <aside className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-card lg:sticky lg:top-28">
          <h2 className="text-base font-bold text-ink">Order summary</h2>
          <div className="space-y-2 text-sm text-zinc-600">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span className="font-medium text-teal">FREE</span>
            </div>
          </div>
          <hr className="border-zinc-200" />
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-ink">Order total</span>
            <Price cents={subtotal} currency={currency} size="md" />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-ink shadow-sm transition hover:bg-gold-600 active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Placing order…
              </>
            ) : (
              <>
                <Lock size={15} /> Place order
              </>
            )}
          </button>
          <p className="flex items-center justify-center gap-1 text-center text-xs text-zinc-500">
            <Lock size={12} /> Secured by Stripe
          </p>
        </aside>
      </form>
    </div>
  );
}
