import { NextRequest } from "next/server";
import { adminProxy } from "@/lib/admin-api";

export async function POST(req: NextRequest) {
  const body = await req.json();
  return adminProxy(req, "/api/order/update", { body });
}
