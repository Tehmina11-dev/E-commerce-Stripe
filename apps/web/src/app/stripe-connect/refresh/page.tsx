"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

function RefreshContent() {
  const searchParams = useSearchParams();
  const workerId = searchParams.get("workerId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetry = async () => {
    if (!workerId) {
      setError("Worker ID is missing from the URL.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Stripe onboarding links are single-use and expire — regenerate a fresh one.
      const res = await fetch("http://localhost:3000/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to regenerate the onboarding link.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No onboarding URL returned from the server.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate onboarding link.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-10 text-center shadow-card">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-amber-100">
        <AlertCircle size={38} className="text-amber-600" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-ink">Session expired</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Your Stripe onboarding session timed out. Click below to pick up right where you left off.
      </p>

      <button
        onClick={handleRetry}
        disabled={loading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-ink shadow-sm transition hover:bg-gold-600 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Regenerating link…
          </>
        ) : (
          <>
            <RefreshCw size={16} /> Retry onboarding
          </>
        )}
      </button>

      {error && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-rose-600">
          <AlertCircle size={14} /> {error}
        </p>
      )}

      <Link
        href="/dashboard"
        className="mt-4 inline-block text-sm font-medium text-zinc-500 underline-offset-4 hover:text-ink hover:underline"
      >
        Back to dashboard
      </Link>
    </div>
  );
}

export default function StripeConnectRefreshPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-mist px-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        }
      >
        <RefreshContent />
      </Suspense>
    </div>
  );
}
