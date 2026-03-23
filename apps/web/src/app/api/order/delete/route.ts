import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Proxy order deletion to the backend.
 * Only unpaid orders can be deleted.
 */
export async function POST(req: NextRequest) {
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

  const body = await req.json();

  const res = await fetch(`${API_URL}/api/order/delete`, {
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
