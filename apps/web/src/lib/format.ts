/**
 * Formats a price stored in the smallest currency unit (cents) into a
 * localized currency string, e.g. 1999 -> "$19.99".
 */
export function formatPrice(cents: number, currency = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

/** Splits a formatted price into whole + fraction for Amazon-style superscripts. */
export function splitPrice(
  cents: number,
  currency = "usd",
): { symbol: string; whole: string; fraction: string } {
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).formatToParts(cents / 100);

  const symbol = parts.find((p) => p.type === "currency")?.value ?? "$";
  const whole = parts.find((p) => p.type === "integer")?.value ?? "0";
  const fraction = parts.find((p) => p.type === "fraction")?.value ?? "00";
  return { symbol, whole, fraction };
}
