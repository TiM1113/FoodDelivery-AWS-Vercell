import { describe, expect, it } from "vitest";
import {
  AddFoodInputSchema,
  UpdateFoodInputSchema,
  FoodCategorySchema,
  UpdateOrderStatusSchema,
  OrderStatusSchema,
} from "@food-delivery/shared";

describe("FoodCategorySchema", () => {
  it("accepts valid categories", () => {
    for (const cat of FoodCategorySchema.options) {
      expect(FoodCategorySchema.safeParse(cat).success).toBe(true);
    }
  });

  it("rejects invalid category", () => {
    expect(FoodCategorySchema.safeParse("InvalidCat").success).toBe(false);
  });
});

describe("AddFoodInputSchema", () => {
  const valid = {
    name: "Pizza",
    description: "A tasty pizza",
    price: 12.5,
    category: "Pasta" as const,
  };

  it("accepts valid input", () => {
    expect(AddFoodInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = AddFoodInputSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = AddFoodInputSchema.safeParse({ ...valid, price: -5 });
    expect(result.success).toBe(false);
  });

  it("rejects zero price", () => {
    const result = AddFoodInputSchema.safeParse({ ...valid, price: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = AddFoodInputSchema.safeParse({ ...valid, category: "Sushi" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateFoodInputSchema", () => {
  const valid = {
    id: "food123",
    name: "Updated Pizza",
    description: "Better pizza",
    price: 15,
    category: "Pasta" as const,
  };

  it("accepts valid update without imageKey", () => {
    expect(UpdateFoodInputSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid update with imageKey", () => {
    const result = UpdateFoodInputSchema.safeParse({
      ...valid,
      imageKey: "uploads/abc.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing id", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...noId } = valid;
    expect(UpdateFoodInputSchema.safeParse(noId).success).toBe(false);
  });

  it("rejects empty id", () => {
    const result = UpdateFoodInputSchema.safeParse({ ...valid, id: "" });
    expect(result.success).toBe(false);
  });
});

describe("UpdateOrderStatusSchema", () => {
  it("accepts valid status update", () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: "order123",
      status: "Food Processing",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    for (const status of OrderStatusSchema.options) {
      const result = UpdateOrderStatusSchema.safeParse({
        orderId: "order123",
        status,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: "order123",
      status: "Cancelled",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty orderId", () => {
    const result = UpdateOrderStatusSchema.safeParse({
      orderId: "",
      status: "Delivered",
    });
    expect(result.success).toBe(false);
  });
});
