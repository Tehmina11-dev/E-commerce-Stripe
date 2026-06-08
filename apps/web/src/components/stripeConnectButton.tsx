// 📁 apps/frontend/components/StripeConnectButton.tsx
"use client";

import { useState } from "react";

interface StripeConnectButtonProps {
  workerId: string;
}

export default function StripeConnectButton({ workerId }: StripeConnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnboarding = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/stripe/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to initiate onboarding link");
      }

      // Redirect user to the secure Stripe Express Onboarding portal
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={handleOnboarding}
        disabled={loading}
        className="px-6 py-3 bg-primary text-dark font-heading font-semibold rounded-xl2 shadow-card hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Connecting..." : "Connect Bank Account via Stripe"}
      </button>
      {error && <p className="text-red-500 font-sans text-sm mt-1">{error}</p>}
    </div>
  );
}