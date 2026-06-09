// 📁 apps/web/src/components/subscribeButton.tsx
"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Settings, Sparkles } from "lucide-react";

interface SubscribeButtonProps {
  workerId: string;
  /** When true, opens the Stripe Customer Portal to manage an existing plan. */
  manage?: boolean;
}

export default function SubscribeButton({ workerId, manage = false }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    const endpoint = manage
      ? "http://localhost:3000/stripe/subscription/portal"
      : "http://localhost:3000/stripe/subscription/checkout";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          typeof data?.message === "string"
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join(", ")
              : "Failed to start the billing flow.";
        throw new Error(message);
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No billing URL returned from the server.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-60 ${
          manage
            ? "border border-zinc-300 text-ink hover:bg-zinc-50"
            : "bg-gold text-ink shadow-sm hover:bg-gold-600"
        }`}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {manage ? "Opening portal…" : "Starting…"}
          </>
        ) : manage ? (
          <>
            <Settings size={16} /> Manage subscription
          </>
        ) : (
          <>
            <Sparkles size={16} /> Upgrade to Pro Seller
          </>
        )}
      </button>

      {error && (
        <p className="flex items-center gap-1.5 text-sm font-medium text-rose-600">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}
