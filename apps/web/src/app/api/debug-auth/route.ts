import { auth } from "@/auth";
import { SignJWT } from "jose";

export async function GET() {
  const diagnostics: Record<string, unknown> = {};

  // Step 1: auth()
  try {
    const session = await auth();
    diagnostics.auth = {
      ok: true,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      role: (session?.user as { role?: string })?.role ?? null,
    };
  } catch (error) {
    diagnostics.auth = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    return Response.json(diagnostics);
  }

  // Step 2: env vars
  diagnostics.env = {
    API_URL: process.env.API_URL ? `set (${process.env.API_URL.substring(0, 30)}...)` : "MISSING",
    JWT_SECRET: process.env.JWT_SECRET ? "set" : "MISSING",
  };

  // Step 3: sign JWT
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    const jwt = await new SignJWT({ id: "test" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1m")
      .sign(secret);
    diagnostics.jwt = { ok: true, length: jwt.length };
  } catch (error) {
    diagnostics.jwt = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    return Response.json(diagnostics);
  }

  // Step 4: backend connectivity
  if (process.env.API_URL) {
    try {
      const res = await fetch(`${process.env.API_URL}/api/food/list`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      const text = await res.text();
      diagnostics.backend = {
        ok: res.ok,
        status: res.status,
        bodyPreview: text.substring(0, 200),
      };
    } catch (error) {
      diagnostics.backend = {
        ok: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      };
    }
  }

  return Response.json(diagnostics);
}
