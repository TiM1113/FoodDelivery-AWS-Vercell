import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { CartInitializer } from "../cart-initializer";
import { useCartStore } from "@/lib/store/cart-store";

let sessionStatus = "unauthenticated";
let sessionData: unknown = null;

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: sessionData, status: sessionStatus }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  useCartStore.setState({ items: {} });
  sessionStatus = "unauthenticated";
  sessionData = null;
});

describe("CartInitializer", () => {
  it("renders nothing visible", () => {
    const { container } = render(<CartInitializer />);

    expect(container.innerHTML).toBe("");
  });

  it("fetches cart when user transitions to authenticated", async () => {
    const cartData = { food1: 2, food2: 1 };
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, cartData }),
    });

    // Start as unauthenticated
    sessionStatus = "unauthenticated";
    sessionData = null;

    const { rerender } = render(<CartInitializer />);

    // Transition to authenticated
    sessionStatus = "authenticated";
    sessionData = { user: { id: "u1" } };

    rerender(<CartInitializer />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/cart/get", { method: "POST" });
    });

    await waitFor(() => {
      expect(useCartStore.getState().items).toEqual(cartData);
    });
  });

  it("does not fetch when session status is loading", () => {
    global.fetch = vi.fn();
    sessionStatus = "loading";

    render(<CartInitializer />);

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles fetch failure silently", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    // Start unauthenticated, then transition
    sessionStatus = "unauthenticated";
    const { rerender } = render(<CartInitializer />);

    sessionStatus = "authenticated";
    sessionData = { user: { id: "u1" } };
    rerender(<CartInitializer />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // Cart remains empty
    expect(useCartStore.getState().items).toEqual({});
  });
});
