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
    const res = await fetch(`${BACKEND_URL}/orders/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the store backend. Is it running on :3000?" },
      { status: 502 },
    );
  }
}
