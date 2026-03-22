import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "";

/**
 * Proxy order verification / cancellation to the backend.
 * Called when user is redirected back from Stripe.
 *
 * - success=false → backend deletes the unpaid order
 * - otherwise → backend returns current payment status
 *
 * No authentication required — this is called during Stripe redirect
 * where the session cookie may not be available.
 * Backend endpoint: GET /api/order/verify?success=...&orderId=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const success = searchParams.get("success") || "";
  const orderId = searchParams.get("orderId") || "";

  const res = await fetch(
    `${API_URL}/api/order/verify?success=${success}&orderId=${orderId}`,
  );

  const data = await res.json();
  return Response.json(data);
}
