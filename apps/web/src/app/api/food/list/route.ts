const API_URL = process.env.API_URL || "";

/**
 * Proxy the food list request to the backend.
 * This avoids CORS issues when the client fetches food data directly
 * (e.g. the cart page on a full page reload).
 */
export async function GET() {
  const res = await fetch(`${API_URL}/api/food/list`, {
    next: { revalidate: 300 },
  });

  const data = await res.json();
  return Response.json(data);
}
