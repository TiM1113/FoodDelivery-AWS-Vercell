import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Proxy order cancellation to the backend.
 * Only orders with status "Payment Pending" or "Food Processing" can be cancelled.
 * If the order was paid, the backend issues a Stripe refund.
 */
export async function POST(req: NextRequest) {
  if (!process.env.API_URL || !process.env.AUTH_SECRET || !process.env.JWT_SECRET) {
    return Response.json(
      { success: false, message: "Server configuration error" },
      { status: 500 },
    );
  }

  const token = await getToken({ req, secret: AUTH_SECRET });

  if (!token?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const backendJwt = await new SignJWT({ id: token.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  try {
    const body = await req.json();
    const res = await fetch(`${process.env.API_URL}/api/order/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${backendJwt}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (error) {
    const status =
      error instanceof DOMException && error.name === "TimeoutError" ? 504 : 502;
    return Response.json(
      { success: false, message: "Order service unavailable" },
      { status },
    );
  }
}
