// 📁 apps/frontend/app/stripe-connect/success/page.tsx
import Link from "next/link";

export default function StripeConnectSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-light p-8 rounded-xl3 text-center border border-gray/20">
        <div className="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-dark mb-2">Payout Setup Complete!</h1>
        <p className="text-dark/70 font-sans mb-6">
          Your bank account has been successfully linked with Stripe Connect. You are now ready to receive direct payouts.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block px-6 py-3 bg-primary text-dark font-heading font-semibold rounded-xl2 shadow-card hover:opacity-90 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}