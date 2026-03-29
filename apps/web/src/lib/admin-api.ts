import { auth } from "@/auth";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Verify the request comes from an authenticated admin user.
 * Returns the backend-compatible JWT or a JSON error response.
 */
export async function getAdminJwt(): Promise<{ jwt: string } | Response> {
  let session;
  try {
    session = await auth();
  } catch (error) {
    console.error("[getAdminJwt] auth() threw:", error);
    return Response.json(
      { success: false, message: `Auth error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }

  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 },
    );
  }

  if (session.user.role !== "admin") {
    return Response.json(
      { success: false, message: "Admin access required" },
      { status: 403 },
    );
  }

  const secret = new TextEncoder().encode(env("JWT_SECRET"));
  const jwt = await new SignJWT({ id: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

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
  const result = await getAdminJwt();
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

  const res = await fetch(`${env("API_URL")}${backendPath}`, fetchOptions);
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
