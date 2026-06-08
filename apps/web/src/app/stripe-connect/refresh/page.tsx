// 📁 apps/frontend/app/stripe-connect/refresh/page.tsx
import Link from "next/link";

export default function StripeConnectRefreshPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-light p-8 rounded-xl3 text-center border border-gray/20">
        <div className="w-16 h-16 bg-secondary/60 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.253 8H18" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading font-bold text-dark mb-2">Session Expired</h1>
        <p className="text-dark/70 font-sans mb-6">
          The onboarding link has expired or the session was interrupted. Please try again to complete the setup.
        </p>
        <Link 
          href="/dashboard" 
          className="inline-block px-6 py-3 bg-primary text-dark font-heading font-semibold rounded-xl2 shadow-card hover:opacity-90 transition"
        >
          Go Back & Retry
        </Link>
      </div>
    </div>
  );
}