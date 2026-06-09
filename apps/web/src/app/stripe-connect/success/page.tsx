"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, AlertCircle, XCircle, ArrowRight } from "lucide-react";

type OnboardingState = "verifying" | "success" | "incomplete" | "error";

function ConnectSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const workerId = searchParams.get("workerId");
  
  const [state, setState] = useState<OnboardingState>("verifying");
  const [statusMessage, setStatusMessage] = useState("Verifying your Stripe onboarding...");

  useEffect(() => {
    if (!workerId) {
      setState("error");
      setStatusMessage("Worker ID is missing from URL parameters.");
      return;
    }

    fetch(`http://localhost:3000/stripe/connect/verify/${workerId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Verification network request failed.");
        return res.json();
      })
      .then((data) => {
        if (data.success || data.isOnboardingDone) {
          setState("success");
          setStatusMessage("Onboarding completed successfully! Redirecting to dashboard...");
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        } else {
          setState("incomplete");
          setStatusMessage(data.message || "Your Stripe Express setup is incomplete.");
        }
      })
      .catch((err) => {
        setState("error");
        setStatusMessage(err instanceof Error ? err.message : "Something went wrong while connecting with the server.");
      });
  }, [workerId, router]);

  // Handle dynamic visual assets mapping based on operation status
  let iconBgColor = "bg-gray/10";
  let iconComponent = <Loader2 size={38} className="animate-spin text-gray" />;
  let cardTitle = "Stripe Connect Status";

  if (state === "success") {
    iconBgColor = "bg-emerald-500/10";
    iconComponent = <CheckCircle2 size={38} className="text-emerald-500" />;
    cardTitle = "Account Connected!";
  } else if (state === "incomplete") {
    iconBgColor = "bg-amber-500/10";
    iconComponent = <AlertCircle size={38} className="text-amber-500" />;
    cardTitle = "Setup Incomplete";
  } else if (state === "error") {
    iconBgColor = "bg-rose-500/10";
    iconComponent = <XCircle size={38} className="text-rose-500" />;
    cardTitle = "Onboarding Link Error";
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray/20 bg-light p-10 text-center shadow-card">
      <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full ${iconBgColor}`}>
        {iconComponent}
      </div>
      
      <h1 className="font-heading text-2xl font-bold text-dark mb-2">
        {cardTitle}
      </h1>
      
      <p className={`text-sm font-sans ${state === "error" ? "text-rose-500 font-medium" : "text-dark/70"}`}>
        {statusMessage}
      </p>

      {state === "success" && (
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 font-sans text-sm font-bold text-dark transition hover:opacity-90"
        >
          Go to Dashboard <ArrowRight size={16} />
        </Link>
      )}

      {(state === "incomplete" || state === "error") && (
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-gray/40 px-6 py-2.5 font-sans text-sm font-bold text-dark transition hover:bg-gray/10"
        >
          Return to Dashboard
        </Link>
      )}
    </div>
  );
}

export default function StripeSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Suspense 
        fallback={
          <div className="flex items-center gap-2 font-sans text-sm text-dark/60">
            <Loader2 size={16} className="animate-spin text-primary" /> Fetching verification workflow...
          </div>
        }
      >
        <ConnectSuccessContent />
      </Suspense>
    </div>
  );
}