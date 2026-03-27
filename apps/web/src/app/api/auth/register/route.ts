import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "";

/**
 * Proxy registration to the Express backend.
 * No authentication required — this creates a new user.
 * After success, the client calls signIn() to establish a NextAuth session.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid request body" },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let res: globalThis.Response;
  try {
    res = await fetch(`${API_URL}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    return Response.json(
      { success: false, message: "Registration service unavailable" },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return Response.json(
      { success: false, message: "Invalid response from server" },
      { status: 502 },
    );
  }

  return Response.json(data, { status: res.status });
}
