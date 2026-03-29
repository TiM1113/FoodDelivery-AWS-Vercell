import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Proxy order placement to the backend.
 * Mints a backend-compatible JWT using the shared JWT_SECRET,
 * attaches the userId from the NextAuth session, and forwards
 * items + address to the backend /api/order/place endpoint.
 *
 * The backend creates a Stripe Checkout Session and returns { session_url }.
 */
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  const backendJwt = await new SignJWT({ id: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const body = await req.json();

  const res = await fetch(`${API_URL}/api/order/place`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${backendJwt}`,
    },
    body: JSON.stringify({
      userId: session.user.id,
      ...body,
    }),
  });

  const data = await res.json();
  return Response.json(data);
}
