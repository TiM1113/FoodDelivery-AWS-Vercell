import { NextRequest } from "next/server";
import { adminProxy } from "@/lib/admin-api";

export async function GET(req: NextRequest) {
  return adminProxy(req, "/api/order/list", { method: "GET" });
}
