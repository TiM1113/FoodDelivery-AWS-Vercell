import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function mintBackendJwt(userId: string) {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: AUTH_SECRET });
  if (!token?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const backendJwt = await mintBackendJwt(token.id as string);
    const res = await fetch(`${API_URL}/api/user/profile`, {
      headers: { Cookie: `token=${backendJwt}` },
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return Response.json(
        { success: false, message: "Backend timeout" },
        { status: 504 },
      );
    }
    return Response.json(
      { success: false, message: "Backend unavailable" },
      { status: 502 },
    );
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: AUTH_SECRET });
  if (!token?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const backendJwt = await mintBackendJwt(token.id as string);
    const body = await req.json();
    const res = await fetch(`${API_URL}/api/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${backendJwt}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return Response.json(
        { success: false, message: "Backend timeout" },
        { status: 504 },
      );
    }
    return Response.json(
      { success: false, message: "Backend unavailable" },
      { status: 502 },
    );
  }
}
