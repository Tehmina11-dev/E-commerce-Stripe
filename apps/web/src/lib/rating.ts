/**
 * The backend has no rating field, so we derive a stable, decorative rating
 * from the product id. Deterministic (same id -> same stars), purely cosmetic.
 */
export function pseudoRating(id: string): { stars: number; reviews: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const stars = 3.8 + (hash % 13) / 10; // 3.8 .. 5.0
  const reviews = 40 + (hash % 1960); // 40 .. ~2000
  return { stars: Math.round(stars * 10) / 10, reviews };
}
