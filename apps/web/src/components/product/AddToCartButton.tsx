"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";

export function AddToCartButton({
  product,
  quantity = 1,
  full = false,
}: {
  product: Product;
  quantity?: number;
  full?: boolean;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;

  function handleAdd() {
    if (soldOut) return;
    addItem(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={soldOut}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 ${
        full ? "w-full" : ""
      } ${
        added
          ? "bg-teal text-white"
          : "bg-gold text-ink shadow-sm hover:bg-gold-600"
      }`}
    >
      {soldOut ? (
        "Out of stock"
      ) : added ? (
        <>
          <Check size={16} /> Added to cart
        </>
      ) : (
        <>
          <ShoppingCart size={16} /> Add to cart
        </>
      )}
    </button>
  );
}
