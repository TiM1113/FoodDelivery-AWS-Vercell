import { NextRequest } from "next/server";
import { adminProxy } from "@/lib/admin-api";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ success: false, message: "Invalid JSON" }, { status: 400 });
  }
  return adminProxy(req, "/api/food/presign", { body });
}
