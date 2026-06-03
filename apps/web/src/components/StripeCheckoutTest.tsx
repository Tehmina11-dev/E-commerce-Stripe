"use client";

import { useState } from "react";

// 👇👇👇 PUT YOUR REAL DATABASE PRODUCT ID HERE 👇👇👇
// Get a valid id from your backend: GET http://localhost:3000/products
const PLACEHOLDER_PRODUCT_ID = "PLACEHOLDER_PRODUCT_ID";
// 👆👆👆 -------------------------------------- 👆👆👆

export function StripeCheckoutTest() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            {
              productId: PLACEHOLDER_PRODUCT_ID,
              quantity: 1,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data?.url) {
        // Redirect the browser to Stripe's hosted checkout page.
        window.location.href = data.url;
      } else {
        throw new Error("Response did not include a checkout `url`.");
      }
    } catch (error) {
      console.error("Stripe checkout failed:", error);
      alert(
        "Checkout failed. Is the backend running on :3000 and is /stripe/checkout implemented? See the console for details.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="rounded-md bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Processing..." : "Test Stripe Checkout"}
    </button>
  );
}
