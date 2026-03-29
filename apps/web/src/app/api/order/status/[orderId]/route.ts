import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Proxy order status polling to the backend.
 * Called by the verify page to check if Stripe webhook has confirmed payment.
 * Backend endpoint: GET /api/order/status/:orderId
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;

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

  const res = await fetch(`${API_URL}/api/order/status/${orderId}`, {
    headers: {
      Cookie: `token=${backendJwt}`,
    },
  });

  const data = await res.json();
  return Response.json(data);
}
