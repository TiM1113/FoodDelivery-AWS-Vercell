import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { SignJWT } from "jose";

const API_URL = process.env.API_URL || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

async function mintBackendJwt(userId: string) {
  return new SignJWT({ id: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const backendJwt = await mintBackendJwt(session.user.id);
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
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  try {
    const backendJwt = await mintBackendJwt(session.user.id);
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
