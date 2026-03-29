import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "./cart-store";
import type { Food } from "@/types/food";

// Reset store state before each test
beforeEach(() => {
  useCartStore.setState({
    items: {},
    promoCode: null,
    promoId: null,
    promoCoupon: null,
  });
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: build a minimal Food object for price calculation tests
// ---------------------------------------------------------------------------
function mockFood(overrides: Partial<Food> & { _id: string }): Food {
  return {
    name: "Test Food",
    description: "Tasty",
    price: 10,
    image: "img.jpg",
    category: "Salad",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// setItems
// ---------------------------------------------------------------------------
describe("setItems", () => {
  it("replaces the entire cart", () => {
    useCartStore.getState().setItems({ a: 2, b: 3 });
    expect(useCartStore.getState().items).toEqual({ a: 2, b: 3 });
  });

  it("filters out zero-quantity entries", () => {
    useCartStore.getState().setItems({ a: 2, b: 0, c: 1 });
    expect(useCartStore.getState().items).toEqual({ a: 2, c: 1 });
  });

  it("filters out negative-quantity entries", () => {
    useCartStore.getState().setItems({ a: -1, b: 3 });
    expect(useCartStore.getState().items).toEqual({ b: 3 });
  });
});

// ---------------------------------------------------------------------------
// addItem
// ---------------------------------------------------------------------------
describe("addItem", () => {
  it("adds a new item with quantity 1 (optimistic)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    await useCartStore.getState().addItem("food_1");

    expect(useCartStore.getState().items).toEqual({ food_1: 1 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/cart/add",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ itemId: "food_1" }),
      }),
    );
  });

  it("increments existing item quantity", async () => {
    useCartStore.setState({ items: { food_1: 2 } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    await useCartStore.getState().addItem("food_1");

    expect(useCartStore.getState().items.food_1).toBe(3);
  });

  it("rolls back on API failure (success: false)", async () => {
    useCartStore.setState({ items: { food_1: 1 } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false }),
    );

    await useCartStore.getState().addItem("food_1");

    // Should roll back to original quantity
    expect(useCartStore.getState().items.food_1).toBe(1);
  });

  it("rolls back on network error", async () => {
    useCartStore.setState({ items: { food_1: 1 } });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    await useCartStore.getState().addItem("food_1");

    expect(useCartStore.getState().items.food_1).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// removeItem
// ---------------------------------------------------------------------------
describe("removeItem", () => {
  it("decrements item quantity", async () => {
    useCartStore.setState({ items: { food_1: 3 } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    await useCartStore.getState().removeItem("food_1");

    expect(useCartStore.getState().items.food_1).toBe(2);
  });

  it("removes item entirely when quantity reaches zero", async () => {
    useCartStore.setState({ items: { food_1: 1 } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    await useCartStore.getState().removeItem("food_1");

    expect(useCartStore.getState().items.food_1).toBeUndefined();
    expect("food_1" in useCartStore.getState().items).toBe(false);
  });

  it("does nothing when item does not exist", async () => {
    const spy = vi.spyOn(globalThis, "fetch");

    await useCartStore.getState().removeItem("nonexistent");

    expect(spy).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toEqual({});
  });

  it("does nothing when item is missing from cart (treated as zero)", async () => {
    useCartStore.setState({ items: {} });
    const spy = vi.spyOn(globalThis, "fetch");

    await useCartStore.getState().removeItem("food_1");

    expect(spy).not.toHaveBeenCalled();
  });

  it("rolls back on API failure", async () => {
    useCartStore.setState({ items: { food_1: 2 } });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false }),
    );

    await useCartStore.getState().removeItem("food_1");

    // Should roll back to original quantity
    expect(useCartStore.getState().items.food_1).toBe(2);
  });

  it("rolls back on network error", async () => {
    useCartStore.setState({ items: { food_1: 2 } });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Offline"));

    await useCartStore.getState().removeItem("food_1");

    expect(useCartStore.getState().items.food_1).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// clearCart
// ---------------------------------------------------------------------------
describe("clearCart", () => {
  it("empties the entire cart", () => {
    useCartStore.setState({ items: { a: 1, b: 2, c: 3 } });

    useCartStore.getState().clearCart();

    expect(useCartStore.getState().items).toEqual({});
  });

  it("works on already-empty cart", () => {
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// getTotalCount
// ---------------------------------------------------------------------------
describe("getTotalCount", () => {
  it("returns 0 for empty cart", () => {
    expect(useCartStore.getState().getTotalCount()).toBe(0);
  });

  it("sums all item quantities", () => {
    useCartStore.setState({ items: { a: 2, b: 3, c: 1 } });
    expect(useCartStore.getState().getTotalCount()).toBe(6);
  });

  it("returns correct count for single item", () => {
    useCartStore.setState({ items: { a: 5 } });
    expect(useCartStore.getState().getTotalCount()).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// getTotalAmount
// ---------------------------------------------------------------------------
describe("getTotalAmount", () => {
  const foods: Food[] = [
    mockFood({ _id: "a", price: 12.5 }),
    mockFood({ _id: "b", price: 8.99 }),
    mockFood({ _id: "c", price: 15 }),
  ];

  it("returns 0 for empty cart", () => {
    expect(useCartStore.getState().getTotalAmount(foods)).toBe(0);
  });

  it("calculates total for single item", () => {
    useCartStore.setState({ items: { a: 2 } });
    // 12.5 * 2 = 25.0
    expect(useCartStore.getState().getTotalAmount(foods)).toBe(25);
  });

  it("calculates total for multiple items", () => {
    useCartStore.setState({ items: { a: 1, b: 2 } });
    // 12.5 * 1 + 8.99 * 2 = 12.5 + 17.98 = 30.48
    expect(useCartStore.getState().getTotalAmount(foods)).toBe(30.48);
  });

  it("rounds to 2 decimal places (floating-point edge case)", () => {
    // 0.1 * 3 = 0.30000000000000004 in JS — Math.round(x * 100) / 100 → 0.3
    const roundingFoods: Food[] = [mockFood({ _id: "x", price: 0.1 })];
    useCartStore.setState({ items: { x: 3 } });
    expect(useCartStore.getState().getTotalAmount(roundingFoods)).toBe(0.3);
  });

  it("ignores items not found in food list", () => {
    useCartStore.setState({ items: { a: 1, unknown_id: 5 } });
    // Only "a" is in the food list: 12.5 * 1 = 12.5
    expect(useCartStore.getState().getTotalAmount(foods)).toBe(12.5);
  });

  it("skips zero-quantity items", () => {
    // Normally setItems filters these out, but test getTotalAmount directly
    useCartStore.setState({ items: { a: 0, b: 2 } });
    // a is skipped (qty <= 0), only b: 8.99 * 2 = 17.98
    expect(useCartStore.getState().getTotalAmount(foods)).toBe(17.98);
  });
});

// ---------------------------------------------------------------------------
// setPromo / clearPromo
// ---------------------------------------------------------------------------
describe("setPromo", () => {
  it("sets promo code, id, and coupon", () => {
    const coupon = { percentOff: 10, amountOff: null, currency: null, name: "10% Off", minimumAmount: null };
    useCartStore.getState().setPromo("SAVE10", "promo_123", coupon);

    const state = useCartStore.getState();
    expect(state.promoCode).toBe("SAVE10");
    expect(state.promoId).toBe("promo_123");
    expect(state.promoCoupon).toEqual(coupon);
  });
});

describe("clearPromo", () => {
  it("clears all promo state", () => {
    useCartStore.setState({
      promoCode: "SAVE10",
      promoId: "promo_123",
      promoCoupon: { percentOff: 10, amountOff: null, currency: null, name: "10% Off", minimumAmount: null },
    });

    useCartStore.getState().clearPromo();

    const state = useCartStore.getState();
    expect(state.promoCode).toBeNull();
    expect(state.promoId).toBeNull();
    expect(state.promoCoupon).toBeNull();
  });
});

describe("clearCart clears promo", () => {
  it("resets promo state when cart is cleared", () => {
    useCartStore.setState({
      items: { a: 1 },
      promoCode: "SAVE10",
      promoId: "promo_123",
      promoCoupon: { percentOff: 10, amountOff: null, currency: null, name: "10% Off", minimumAmount: null },
    });

    useCartStore.getState().clearCart();

    const state = useCartStore.getState();
    expect(state.items).toEqual({});
    expect(state.promoCode).toBeNull();
    expect(state.promoId).toBeNull();
    expect(state.promoCoupon).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getDiscount
// ---------------------------------------------------------------------------
describe("getDiscount", () => {
  it("returns 0 when no promo is applied", () => {
    expect(useCartStore.getState().getDiscount(100)).toBe(0);
  });

  it("calculates percentage discount", () => {
    useCartStore.setState({
      promoCoupon: { percentOff: 15, amountOff: null, currency: null, name: "15% Off", minimumAmount: null },
    });
    // 100 * 15% = 15
    expect(useCartStore.getState().getDiscount(100)).toBe(15);
  });

  it("rounds percentage discount to 2 decimal places", () => {
    useCartStore.setState({
      promoCoupon: { percentOff: 10, amountOff: null, currency: null, name: "10% Off", minimumAmount: null },
    });
    // 33.33 * 10% = 3.333 → 3.33
    expect(useCartStore.getState().getDiscount(33.33)).toBe(3.33);
  });

  it("calculates fixed amount discount", () => {
    useCartStore.setState({
      promoCoupon: { percentOff: null, amountOff: 5, currency: "usd", name: "$5 Off", minimumAmount: null },
    });
    expect(useCartStore.getState().getDiscount(100)).toBe(5);
  });

  it("caps fixed discount at subtotal", () => {
    useCartStore.setState({
      promoCoupon: { percentOff: null, amountOff: 20, currency: "usd", name: "$20 Off", minimumAmount: null },
    });
    // Discount ($20) exceeds subtotal ($10), so it should cap at $10
    expect(useCartStore.getState().getDiscount(10)).toBe(10);
  });

  it("returns 0 for coupon with no percentOff or amountOff", () => {
    useCartStore.setState({
      promoCoupon: { percentOff: null, amountOff: null, currency: null, name: "Unknown", minimumAmount: null },
    });
    expect(useCartStore.getState().getDiscount(100)).toBe(0);
  });
});
