"use client";

import { useState } from "react";
import { AlertCircle, Landmark, Loader2 } from "lucide-react";

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

      // 🎯 Safe raw text extract karein taake parse fail hone par crash na ho
      const responseText = await response.text();
      let data: any = {};
      
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(responseText || "Invalid server response structure.");
      }

      if (!response.ok) {
        let errorMessage = "Failed to initiate onboarding link";

        // 🎯 NestJS Exception ke objects ko handle karne ke liye strict string validation layer
        if (data) {
          if (typeof data.message === "string") {
            errorMessage = data.message;
          } else if (Array.isArray(data.message)) {
            errorMessage = data.message.join(", ");
          } else if (typeof data.message === "object" && data.message !== null) {
            errorMessage = JSON.stringify(data.message);
          } else if (data.error) {
            errorMessage = typeof data.error === "string" ? data.error : JSON.stringify(data.error);
          }
        }

        throw new Error(errorMessage);
      }

      // Redirect user to the secure Stripe Express onboarding portal
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No onboarding URL returned from the server.");
      }
    } catch (err: any) {
      console.error("Stripe Onboarding Catch Triggered:", err);
      // Ensure error is strictly a string and not an object instance
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 w-full">
      <button
        onClick={handleOnboarding}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-dark shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin text-dark" /> Connecting…
          </>
        ) : (
          <>
            <Landmark size={16} className="text-dark" /> Connect bank account via Stripe
          </>
        )}
      </button>
      
      {/* Dynamic strict verified error layout layer */}
      {error && (
        <div className="flex items-start gap-2 text-xs font-sans text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl w-full mt-1">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}