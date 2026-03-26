import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddToCartButton } from "../add-to-cart-button";
import { useCartStore } from "@/lib/store/cart-store";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseSession = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Reset cart store state
  useCartStore.setState({ items: {} });
});

describe("AddToCartButton", () => {
  it("shows + button when quantity is 0", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });

    render(<AddToCartButton foodId="food1" />);

    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
  });

  it("redirects to login when not authenticated and clicking add", () => {
    mockUseSession.mockReturnValue({ data: null });

    render(<AddToCartButton foodId="food1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("shows quantity controls when item is in cart", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });
    useCartStore.setState({ items: { food1: 3 } });

    render(<AddToCartButton foodId="food1" />);

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove one" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add one more" })).toBeInTheDocument();
  });

  it("calls addItem on + click when authenticated", () => {
    mockUseSession.mockReturnValue({ data: { user: { id: "u1" } } });

    render(<AddToCartButton foodId="food1" />);

    fireEvent.click(screen.getByRole("button", { name: "Add to cart" }));

    // Optimistic update should have set quantity to 1
    expect(useCartStore.getState().items.food1).toBe(1);
  });
});
