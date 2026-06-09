"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useCart } from "../../components/cart/CartProvider"; 

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  
  // 🎯 Access the clear function from context
  const { clear } = useCart(); 

  const [workerId, setWorkerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🎯 Clear the cart state and localStorage immediately on mount
    clear(); 
    
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const fetchSessionDetails = async () => {
      try {
        const res = await fetch(`http://localhost:3000/stripe/checkout-session/${sessionId}`);
        const data = await res.json();
        if (data?.workerId) {
          setWorkerId(data.workerId);
        }
      } catch (err) {
        console.error("Error fetching session details:", err);
      } finally {
        setLoading(false);
        // Force refresh to ensure all UI components sync the new empty state
        router.refresh();
      }
    };

    fetchSessionDetails();
  }, [sessionId, clear, router]);

  return (
    <div className="w-full max-w-md rounded-3xl border border-gray/20 bg-light p-10 text-center shadow-card">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10">
        {loading ? (
          <Loader2 size={38} className="animate-spin text-emerald-500" />
        ) : (
          <CheckCircle2 size={38} className="text-emerald-500" />
        )}
      </div>
      
      <h1 className="font-heading text-2xl font-bold text-dark">
        {loading ? "Verifying Payment..." : "Order Placed Successfully!"}
      </h1>
      
      <p className="mt-2 font-sans text-sm text-dark/70">
        {loading 
          ? "Please wait while we confirm your transaction with Stripe..." 
          : "Thank you for your payment. Your cart has been cleared and order is confirmed."
        }
      </p>

      {!loading && workerId && (
        <p className="mt-4 font-sans text-xs text-dark/60 bg-secondary/50 py-1.5 px-3 rounded-lg inline-block border border-gray/20">
          Assigned Worker: <span className="font-mono font-bold text-dark">{workerId}</span>
        </p>
      )}
      
      {!loading && (
        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-2.5 font-sans text-sm font-bold text-dark transition hover:opacity-90 shadow-sm"
        >
          Go to Dashboard
        </Link>
      )}
    </div>
  );
}

export default function CustomerSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 font-sans text-sm text-dark/60">
            <Loader2 size={18} className="animate-spin text-primary" /> Loading session pipeline...
          </div>
        }
      >
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}