import { create } from "zustand";
import type { Food } from "@/types/food";

interface CartState {
  /** Map of food ID → quantity */
  items: Record<string, number>;

  /** Replace entire cart (used when loading from backend on login) */
  setItems: (data: Record<string, number>) => void;

  /** Add one unit of a food item (optimistic + backend sync) */
  addItem: (foodId: string) => Promise<void>;

  /** Remove one unit of a food item (optimistic + backend sync) */
  removeItem: (foodId: string) => Promise<void>;

  /** Clear cart locally (used on sign-out) */
  clearCart: () => void;

  /** Total number of items across all foods */
  getTotalCount: () => number;

  /** Total price given a food list (for looking up prices) */
  getTotalAmount: (foods: Food[]) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: {},

  setItems: (data) => {
    // Filter out zero-quantity entries
    const cleaned: Record<string, number> = {};
    for (const [id, qty] of Object.entries(data)) {
      if (qty > 0) cleaned[id] = qty;
    }
    set({ items: cleaned });
  },

  addItem: async (foodId) => {
    // Optimistic update
    const prev = { ...get().items };
    set({
      items: { ...prev, [foodId]: (prev[foodId] || 0) + 1 },
    });

    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: foodId }),
      });
      const data = await res.json();
      if (!data.success) {
        // Rollback
        set({ items: prev });
      }
    } catch {
      // Rollback on network error
      set({ items: prev });
    }
  },

  removeItem: async (foodId) => {
    const prev = { ...get().items };
    const current = prev[foodId] || 0;
    if (current <= 0) return;

    const updated = { ...prev, [foodId]: current - 1 };
    if (updated[foodId] <= 0) delete updated[foodId];
    set({ items: updated });

    try {
      const res = await fetch("/api/cart/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: foodId }),
      });
      const data = await res.json();
      if (!data.success) {
        set({ items: prev });
      }
    } catch {
      set({ items: prev });
    }
  },

  clearCart: () => set({ items: {} }),

  getTotalCount: () => {
    return Object.values(get().items).reduce((sum, qty) => sum + qty, 0);
  },

  getTotalAmount: (foods) => {
    const { items } = get();
    let total = 0;
    for (const [id, qty] of Object.entries(items)) {
      if (qty <= 0) continue;
      const food = foods.find((f) => f._id === id);
      if (food) total += food.price * qty;
    }
    return Math.round(total * 100) / 100;
  },
}));
