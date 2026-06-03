import "server-only";
import type { Product } from "./types";

/**
 * Base URL of the NestJS backend. All calls here run on the server
 * (Server Components / Route Handlers), so there is no CORS concern and
 * the backend is never exposed directly to the browser.
 */
export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/products`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as Product[];
  } catch {
    // Backend unreachable — render an empty/fallback state rather than crash.
    return [];
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/products/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}
