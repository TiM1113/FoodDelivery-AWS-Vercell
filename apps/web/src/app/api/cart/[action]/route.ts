import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");
const VALID_ACTIONS = ["add", "remove", "get"] as const;

/**
 * Proxy cart operations to the backend.
 * All three backend cart endpoints (add, remove, get) use POST.
 * Authentication: we mint a backend-compatible JWT on the fly using
 * the shared JWT_SECRET, so there is no dependency on capturing the
 * backend token at login time.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;

  if (!VALID_ACTIONS.includes(action as (typeof VALID_ACTIONS)[number])) {
    return Response.json(
      { success: false, message: "Invalid cart action" },
      { status: 400 },
    );
  }

  const token = await getToken({ req, secret: AUTH_SECRET });

  if (!token?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  // Create a backend-compatible JWT: { id: userId } signed with JWT_SECRET
  const backendJwt = await new SignJWT({ id: token.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const body = action !== "get" ? await req.json() : {};

  const res = await fetch(`${API_URL}/api/cart/${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: `token=${backendJwt}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data);
}
