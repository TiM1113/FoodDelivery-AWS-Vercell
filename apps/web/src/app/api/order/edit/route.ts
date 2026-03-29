import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Proxy order editing to the backend.
 * Only unpaid orders can be edited (modify items / amounts).
 */
export async function POST(req: NextRequest) {
  if (!process.env.API_URL || !process.env.JWT_SECRET) {
    return Response.json(
      { success: false, message: "Server configuration error" },
      { status: 500 },
    );
  }

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

  try {
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/order/edit`, {
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
