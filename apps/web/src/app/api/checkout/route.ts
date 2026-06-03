import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/api";

/**
 * Server-side proxy to the NestJS checkout endpoint. Keeping this on the
 * server avoids browser CORS issues and hides the backend origin.
 *
 * Body: { items: { productId: string; quantity: number }[]; customerEmail?: string }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid request body." }, { status: 400 });
  }

  try {
    // 🎯 FIX: Path ko '/orders/checkout' se badal kar '/stripe/checkout' kiya hai
    const res = await fetch(`${BACKEND_URL}/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the store backend. Is it running?" },
      { status: 502 },
    );
  }
}