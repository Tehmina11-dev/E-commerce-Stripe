"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";
import StripeConnectButton from "@/components/stripeConnectButton";
import SubscribeButton from "@/components/subscribeButton";

const WORKER_ID = "eeac6a76-7d9e-4f86-99a0-b907b20f65c4";

// Mock profile placeholder until a real worker/auth API is wired up.
const WORKER_PROFILE = {
  name: "Jordan Avery",
  role: "Verified Seller",
  email: "jordan.avery@example.com",
  initials: "JA",
};

type OnboardingState = "loading" | "connected" | "not_connected" | "error";
type SubState = "loading" | "subscribed" | "not_subscribed" | "error";

export default function DashboardPage() {
  const [state, setState] = useState<OnboardingState>("loading");
  const [backendError, setBackendError] = useState<string | null>(null);

  const [subState, setSubState] = useState<SubState>("loading");
  const [subStatusLabel, setSubStatusLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      try {
        const res = await fetch(`http://localhost:3000/stripe/connect/verify/${WORKER_ID}`);
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          const msg = Array.isArray(data?.message)
            ? data.message.join(", ")
            : typeof data?.message === "string"
              ? data.message
              : "Failed to load onboarding status.";
          throw new Error(msg);
        }

        if (data.success || data.isOnboardingDone) {
          setState("connected");
        } else {
          setState("not_connected");
        }
      } catch (err: any) {
        if (!cancelled) {
          setState("error");
          // 🎯 Safe check to extract clear string instead of [object Object]
          setBackendError(err instanceof Error ? err.message : "Server connection timeout.");
        }
      }
    };

    const loadSubscription = async () => {
      try {
        const res = await fetch(`http://localhost:3000/stripe/subscription/status/${WORKER_ID}`);
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;
        if (!res.ok) throw new Error(data?.message || "Failed to load subscription.");

        setSubStatusLabel(data?.subscription?.status ?? null);
        setSubState(data?.isSubscribed ? "subscribed" : "not_subscribed");
      } catch {
        if (!cancelled) setSubState("error");
      }
    };

    loadStatus();
    loadSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-dark">Worker dashboard</h1>
          <p className="font-sans text-sm text-dark/70">
            Manage your profile and payout settings in one place.
          </p>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Profile card */}
          <aside className="h-fit rounded-2xl border border-gray/20 bg-light p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-dark text-lg font-bold text-white">
                {WORKER_PROFILE.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-heading text-base font-bold text-dark">{WORKER_PROFILE.name}</p>
                <span className="mt-0.5 inline-flex items-center gap-1 font-sans text-xs font-medium text-emerald-600">
                  <BadgeCheck size={13} /> {WORKER_PROFILE.role}
                </span>
              </div>
            </div>

            <dl className="mt-6 space-y-3 font-sans text-sm">
              <div className="flex items-center justify-between border-b border-gray/10 pb-2">
                <dt className="text-dark/60">Email</dt>
                <dd className="truncate font-medium text-dark">{WORKER_PROFILE.email}</dd>
              </div>
              <div className="flex items-center justify-between pt-1">
                <dt className="text-dark/60">Worker ID</dt>
                <dd className="font-mono text-xs font-bold text-dark/80 bg-gray/20 px-1.5 py-0.5 rounded">{WORKER_ID}</dd>
              </div>
            </dl>
          </aside>

          {/* Payouts / Stripe Connect widget */}
          <section className="rounded-2xl border border-gray/20 bg-light p-6 shadow-card">
            <div className="flex items-center gap-2">
              <Wallet size={18} className="text-dark" />
              <h2 className="font-heading text-base font-bold text-dark">Payouts</h2>
            </div>
            <p className="mt-1 font-sans text-sm text-dark/70">
              Connect a bank account through Stripe to start receiving your earnings.
            </p>

            <div className="mt-6">
              {state === "loading" && (
                <div className="flex items-center gap-2 rounded-xl border border-gray/20 bg-gray/5 px-4 py-3 font-sans text-sm text-dark/70">
                  <Loader2 size={16} className="animate-spin text-primary" /> Checking your payout status…
                </div>
              )}

              {state === "connected" && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                  <CheckCircle2 size={20} className="shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="font-sans text-sm font-bold text-emerald-800">Stripe connected successfully</p>
                    <p className="font-sans text-xs text-emerald-700/90 mt-0.5">
                      Your account is verified and ready to receive payouts directly.
                    </p>
                  </div>
                </div>
              )}

              {state === "not_connected" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <CreditCard size={20} className="mt-0.5 shrink-0 text-amber-600" />
                    <div>
                      <p className="font-sans text-sm font-bold text-amber-800">Payouts not set up yet</p>
                      <p className="font-sans text-xs text-amber-700/90 mt-0.5">
                        You won&apos;t be able to receive earnings until your bank account is linked.
                      </p>
                    </div>
                  </div>
                  <StripeConnectButton workerId={WORKER_ID} />
                </div>
              )}

              {state === "error" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-600" />
                    <div>
                      <p className="font-sans text-sm font-bold text-rose-800">Couldn&apos;t load status</p>
                      <p className="font-sans text-xs text-rose-700/90 mt-0.5">
                        {backendError || "We couldn't reach the server. You can still retry initialization below."}
                      </p>
                    </div>
                  </div>
                  <StripeConnectButton workerId={WORKER_ID} />
                </div>
              )}
            </div>
          </section>

          {/* Subscription / Pro plan widget (spans full width under the grid) */}
          <section className="rounded-2xl border border-gray/20 bg-light p-6 shadow-card lg:col-span-2">
            <div className="flex items-center gap-2">
              <Crown size={18} className="text-primary" />
              <h2 className="font-heading text-base font-bold text-dark">Pro Seller plan</h2>
            </div>
            <p className="mt-1 font-sans text-sm text-dark/70">
              Unlock lower platform fees and premium placement with a recurring subscription.
            </p>

            <div className="mt-6">
              {subState === "loading" && (
                <div className="flex items-center gap-2 rounded-xl border border-gray/20 bg-gray/5 px-4 py-3 font-sans text-sm text-dark/70">
                  <Loader2 size={16} className="animate-spin text-primary" /> Checking your subscription…
                </div>
              )}

              {subState === "subscribed" && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <Sparkles size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-sans text-sm font-bold text-emerald-800">
                        You&apos;re on the Pro Seller plan
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-emerald-700/90">
                        Status: {subStatusLabel?.toLowerCase() ?? "active"} · billed monthly.
                      </p>
                    </div>
                  </div>
                  <SubscribeButton workerId={WORKER_ID} manage />
                </div>
              )}

              {subState === "not_subscribed" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-gray/20 bg-gray/5 p-4">
                    <Crown size={20} className="mt-0.5 shrink-0 text-dark/50" />
                    <div>
                      <p className="font-sans text-sm font-bold text-dark">Free plan</p>
                      <p className="mt-0.5 font-sans text-xs text-dark/60">
                        Upgrade any time. Cancel from the billing portal whenever you like.
                      </p>
                    </div>
                  </div>
                  <SubscribeButton workerId={WORKER_ID} />
                </div>
              )}

              {subState === "error" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <ShieldAlert size={20} className="mt-0.5 shrink-0 text-rose-600" />
                    <div>
                      <p className="font-sans text-sm font-bold text-rose-800">
                        Couldn&apos;t load subscription
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-rose-700/90">
                        We couldn&apos;t reach the billing service. You can still try upgrading below.
                      </p>
                    </div>
                  </div>
                  <SubscribeButton workerId={WORKER_ID} />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}