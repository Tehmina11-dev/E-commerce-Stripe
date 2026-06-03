"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/lib/types";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const router = useRouter();
  const soldOut = product.stock <= 0;

  function buyNow() {
    if (soldOut) return;
    addItem(product, qty);
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      {!soldOut && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-600">Quantity</span>
          <QuantityStepper
            value={qty}
            onChange={setQty}
            max={Math.min(product.stock, 99)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <AddToCartButton product={product} quantity={qty} full />
        <button
          type="button"
          onClick={buyNow}
          disabled={soldOut}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-600 px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:bg-gold-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
        >
          <Zap size={16} fill="currentColor" /> Buy now
        </button>
      </div>
    </div>
  );
}
