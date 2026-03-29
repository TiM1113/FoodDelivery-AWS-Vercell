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

  // Step 4: backend proxy test (simulates adminProxy flow)
  if (process.env.API_URL && process.env.JWT_SECRET) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const userId = (diagnostics.auth as { userId: string | null }).userId ?? "test";
      const backendJwt = await new SignJWT({ id: userId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("7d")
        .sign(secret);

      const url = `${process.env.API_URL}/api/order/stats`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Cookie: `token=${backendJwt}`,
      };

      // Test 1: with Cookie header (current approach)
      const res1 = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      const text1 = await res1.text();

      // Test 2: echo headers to see what actually gets sent
      const echoRes = await fetch("https://httpbin.org/headers", {
        headers: { Cookie: `token=${backendJwt}`, "X-Test": "hello" },
        signal: AbortSignal.timeout(5000),
      });
      const echoData = await echoRes.json();

      diagnostics.proxyTest = {
        cookieApproach: { status: res1.status, body: text1.substring(0, 200) },
        echoHeaders: echoData.headers,
        jwtPreview: backendJwt.substring(0, 50) + "...",
      };
    } catch (error) {
      diagnostics.proxyTest = {
        ok: false,
        error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
      };
    }
  }

  return Response.json(diagnostics);
}
