import Link from "next/link";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-card">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50">
          <XCircle size={40} className="text-rose-500" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">Checkout cancelled</h1>
        <p className="mt-2 text-sm text-zinc-600">
          No worries — your cart is saved. You can complete your purchase whenever
          you&apos;re ready.
        </p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/cart"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-600"
          >
            Return to cart
          </Link>
          <Link
            href="/"
            className="rounded-full border border-zinc-300 px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-zinc-50"
          >
            Keep shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
