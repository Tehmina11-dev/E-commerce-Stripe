import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Debug: Check if the frontend is actually sending workerId
    console.log("Proxy received payload:", JSON.stringify(body, null, 2));

    const res = await fetch(`${BACKEND_URL}/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), // Sending the exact body forward
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Backend rejected request:", data);
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { message: "Unable to reach the store backend." },
      { status: 502 }
    );
  }
}