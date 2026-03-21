import type { FoodListResponse } from "@/types/food";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;

export async function fetchFoodList(): Promise<FoodListResponse> {
  if (!API_URL) {
    throw new Error("API_URL is not configured. Set API_URL or NEXT_PUBLIC_API_URL env var.");
  }

  const res = await fetch(`${API_URL}/api/food/list`, {
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch food list: ${res.status}`);
  }

  return res.json();
}
