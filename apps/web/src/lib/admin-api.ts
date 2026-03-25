import { getToken } from "next-auth/jwt";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "";
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Verify the request comes from an authenticated admin user.
 * Returns the backend-compatible JWT or a JSON error response.
 */
export async function getAdminJwt(
  req: NextRequest,
): Promise<{ jwt: string } | Response> {
  const token = await getToken({ req, secret: AUTH_SECRET });

  if (!token?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  if (token.role !== "admin") {
    return Response.json(
      { success: false, message: "Admin access required" },
      { status: 403 },
    );
  }

  const jwt = await new SignJWT({ id: token.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  return { jwt };
}

/**
 * Proxy a request to the backend with admin authentication.
 */
export async function adminProxy(
  req: NextRequest,
  backendPath: string,
  options?: { method?: string; body?: unknown },
): Promise<Response> {
  const result = await getAdminJwt(req);
  if (result instanceof Response) return result;

  const method = options?.method ?? "POST";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Cookie: `token=${result.jwt}`,
  };

  const fetchOptions: RequestInit = { method, headers };
  if (method !== "GET" && options?.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_URL}${backendPath}`, fetchOptions);
  const data = await res.json();
  return Response.json(data);
}
