"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

/** Clears the cart once after a successful order (also covers Stripe redirects). */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
