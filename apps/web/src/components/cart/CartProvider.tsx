"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, Product } from "@/lib/types";

const STORAGE_KEY = "premium-cart:v1";

interface CartContextValue {
  lines: CartLine[];
  /** Total number of items (sum of quantities). */
  count: number;
  /** Subtotal in the smallest currency unit (cents). */
  subtotal: number;
  currency: string;
  hydrated: boolean;
  addItem: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted cart once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [lines, hydrated]);

  const clampToStock = (qty: number, stock: number) =>
    Math.max(1, Math.min(qty, Math.max(stock, 1)));

  const addItem = useCallback((product: Product, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === product.id);
      if (existing) {
        return prev.map((l) =>
          l.productId === product.id
            ? { ...l, quantity: clampToStock(l.quantity + quantity, product.stock) }
            : l,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          currency: product.currency,
          imageUrl: product.imageUrl,
          stock: product.stock,
          // Capture the seller so checkout can attribute the Connect payout.
          workerId: product.workerId ?? "",
          quantity: clampToStock(quantity, product.stock),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      prev.flatMap((l) => {
        if (l.productId !== productId) return [l];
        if (quantity <= 0) return [];
        return [{ ...l, quantity: clampToStock(quantity, l.stock) }];
      }),
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      currency: lines[0]?.currency ?? "usd",
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [lines, hydrated, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
