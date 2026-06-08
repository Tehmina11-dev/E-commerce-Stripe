"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";

export function ClearCartOnMount() {
  const { clear } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (!hasCleared.current) {
      // 1. Empty\0 the context state
      clear();
      
      // 2. Force remove exact key from local storage
      localStorage.removeItem("premium-cart:v1");
      
      hasCleared.current = true;
    }
  }, [clear]);

  return null;
}