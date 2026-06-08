// 📁 apps/frontend/app/test-connect/page.tsx
"use client";

import StripeConnectButton from "../../components/stripeConnectButton"; // Apne button component ka sahi path check kar lein

export default function TestConnectPage() {
  // ⚠️ ID REPLACE KAREIN: 
  // Jo workerId aapne backend ke 'create-test-worker' endpoint se copy ki thi, usay yahan niche paste karein:
  const testWorkerId = "66fbbe4c-ce42-417b-8751-aede192ec4a4";

  return (
    <div className="min-h-screen bg-[#fcf9f2] flex flex-col items-center justify-center p-6">
      <div className="bg-[#fff1d7] p-8 rounded-[2.5rem] shadow-[0_10px_30px_rgba(255,181,51,0.2)] max-w-md w-full border border-[#c7c7c5]/20 text-center">
        <h1 className="font-heading font-bold text-2xl text-[#323230] mb-4">
          Stripe Connect Testing
        </h1>
        <p className="font-sans text-sm text-[#323230]/70 mb-6">
          Click the button below to test the onboarding flow for Worker ID: <br />
          <span className="font-mono bg-white px-2 py-1 rounded text-xs block mt-2 text-[#323230]">
            {testWorkerId}
          </span>
        </p>

        <div className="flex justify-center">
          {/* Rendering our custom Stripe Connect Button */}
          <StripeConnectButton workerId={testWorkerId} />
        </div>
      </div>
    </div>
  );
}