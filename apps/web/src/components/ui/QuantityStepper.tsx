"use client";

import { Minus, Plus } from "lucide-react";

export function QuantityStepper({
  value,
  onChange,
  max = 99,
  min = 1,
}: {
  value: number;
  onChange: (next: number) => void;
  max?: number;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-zinc-300 bg-white shadow-sm">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="grid h-9 w-9 place-items-center rounded-full text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40"
      >
        <Minus size={16} />
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums">
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="grid h-9 w-9 place-items-center rounded-full text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-40"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
