import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    return Response.json({
      success: true,
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      role: (session?.user as { role?: string })?.role ?? null,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.split("\n").slice(0, 5) : null,
    });
  }
}
