import { NextRequest } from "next/server";

const API_URL = process.env.API_URL || "";

/**
 * Proxy the food list request to the backend.
 * Forwards query params (q, category, minPrice, maxPrice, sortBy) for
 * server-side filtering. When no params are provided the backend returns
 * all foods (backwards compatible).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString();
  const url = qs
    ? `${API_URL}/api/food/list?${qs}`
    : `${API_URL}/api/food/list`;

  const res = await fetch(url, {
    next: { revalidate: qs ? 0 : 300 },
  });

  const data = await res.json();
  return Response.json(data);
}
