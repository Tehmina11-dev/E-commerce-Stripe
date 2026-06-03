import Link from "next/link";
import { CheckCircle2, Package } from "lucide-react";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";

export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; session_id?: string }>;
}) {
  const { orderId, session_id } = await searchParams;
  const reference = orderId ?? session_id;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <ClearCartOnMount />
      <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-card">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-teal/10">
          <CheckCircle2 size={40} className="text-teal" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your order has been placed successfully. A confirmation will be sent to
          your email shortly.
        </p>

        {reference && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            <Package size={15} /> Order reference:{" "}
            <span className="font-mono text-ink">{reference}</span>
          </p>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-600"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
