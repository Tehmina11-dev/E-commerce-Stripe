import { splitPrice } from "@/lib/format";

/** Amazon-style price with a superscripted currency symbol and cents. */
export function Price({
  cents,
  currency = "usd",
  size = "md",
}: {
  cents: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { symbol, whole, fraction } = splitPrice(cents, currency);
  const whichSize = {
    sm: { sym: "text-[0.7em]", whole: "text-lg" },
    md: { sym: "text-sm", whole: "text-2xl" },
    lg: { sym: "text-base", whole: "text-4xl" },
  }[size];

  return (
    <span className="inline-flex items-start font-semibold text-ink leading-none">
      <span className={`mt-[0.2em] ${whichSize.sym}`}>{symbol}</span>
      <span className={`${whichSize.whole} tracking-tight`}>{whole}</span>
      <span className={`mt-[0.2em] ${whichSize.sym}`}>{fraction}</span>
    </span>
  );
}
