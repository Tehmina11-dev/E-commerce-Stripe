import { StripeCheckoutTest } from "@/components/StripeCheckoutTest";

export default function TestCheckoutPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-bold">Stripe Integration Test</h1>
      <p className="text-sm text-zinc-500">
        Set <code>PLACEHOLDER_PRODUCT_ID</code> in
        <code> StripeCheckoutTest.tsx</code>, then click the button. On success
        you&apos;ll be redirected to Stripe&apos;s hosted checkout.
      </p>
      <StripeCheckoutTest />
    </div>
  );
}
