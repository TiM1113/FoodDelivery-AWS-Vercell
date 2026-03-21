import type { Food, FoodCategory } from "@food-delivery/shared";

export type { Food, FoodCategory };

export interface FoodListResponse {
  success: boolean;
  data: Food[];
  count: number;
}
