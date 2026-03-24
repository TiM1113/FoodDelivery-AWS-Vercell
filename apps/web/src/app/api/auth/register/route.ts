import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "";

/**
 * Proxy registration to the Express backend.
 * No authentication required — this creates a new user.
 * After success, the client calls signIn() to establish a NextAuth session.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const res = await fetch(`${API_URL}/api/user/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return Response.json(data, { status: res.status });
}
