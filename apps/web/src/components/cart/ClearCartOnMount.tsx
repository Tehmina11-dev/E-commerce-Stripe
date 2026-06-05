"use client";

import { useEffect, useRef } from "react";
import { useCart } from "./CartProvider";

export function ClearCartOnMount() {
  const { clear } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (!hasCleared.current) {
      // 1. Context ki state ko 0/empty karein
      clear();
      
      // 2. LocalStorage se aapki exact key ko force remove karein
      localStorage.removeItem("premium-cart:v1");
      
      hasCleared.current = true;
    }
  }, [clear]);

  return null;
}