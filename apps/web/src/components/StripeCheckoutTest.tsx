"use client";

import { useState } from "react";

// Real database credentials provided
const VALID_PRODUCT_ID = "cmpwhqpk50000dcxuwr63cezw";
const VALID_WORKER_ID = "66fbbe4c-ce42-417b-8751-aede192ec4a4"; 

export function StripeCheckoutTest() {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          items: [
            {
              productId: VALID_PRODUCT_ID,
              quantity: 1,
            },
          ],
          // Matches the flat structure your NestJS @Body('workerId') expects
          workerId: VALID_WORKER_ID,
        }),
      });

      // Parse error payload cleanly if the response fails
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend Error Context:", errorData);
        
        const errorMessage = errorData?.message?.message || errorData?.message || "Unknown validation error";
        throw new Error(`Request failed (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();

      if (data?.url) {
        // Safe cross-origin redirect to Stripe checkout interface
        window.location.href = data.url;
      } else {
        throw new Error("Response did not include a valid Stripe checkout URL.");
      }
    } catch (error: any) {
      console.error("Stripe checkout processing failed:", error);
      alert(error.message || "Checkout failed. Please check the developer console.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-primary hover:bg-opacity-90 text-dark px-6 py-3 font-heading font-semibold rounded-xl2 transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 shadow-card"
    >
      {loading ? "Processing..." : "Test Stripe Checkout"}
    </button>
  );
}