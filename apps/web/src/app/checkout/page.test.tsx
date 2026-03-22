import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCartStore } from "@/lib/store/cart-store";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", () => {
  function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return { default: MockLink };
});

import CheckoutPage from "./page";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return Wrapper;
}

beforeEach(() => {
  vi.restoreAllMocks();
  mockPush.mockReset();
  useCartStore.setState({ items: {} });
});

describe("CheckoutPage", () => {
  it("shows loading state while fetching foods", () => {
    // fetch never resolves → stays in pending
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise(() => {}));
    useCartStore.setState({ items: { food1: 2 } });

    render(<CheckoutPage />, { wrapper: createWrapper() });

    expect(screen.getByText("Loading checkout…")).toBeDefined();
  });

  it("shows empty cart state when cart has no items", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: [{ _id: "food1", name: "Pizza", price: 12, image: "img.jpg", category: "Pizza", description: "Tasty" }] }),
    );
    useCartStore.setState({ items: {} });

    render(<CheckoutPage />, { wrapper: createWrapper() });

    // Wait for query to resolve
    const heading = await screen.findByText("Your cart is empty");
    expect(heading).toBeDefined();
  });

  it("shows empty cart when cart items don't match any foods", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ data: [{ _id: "food1", name: "Pizza", price: 12, image: "img.jpg", category: "Pizza", description: "Tasty" }] }),
    );
    // Cart has a food ID that doesn't exist in the food list
    useCartStore.setState({ items: { nonexistent: 1 } });

    render(<CheckoutPage />, { wrapper: createWrapper() });

    const heading = await screen.findByText("Your cart is empty");
    expect(heading).toBeDefined();
  });

  it("renders form fields and order summary when cart has items", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        data: [
          { _id: "f1", name: "Pizza", price: 12, image: "img.jpg", category: "Pizza", description: "Tasty" },
          { _id: "f2", name: "Burger", price: 8.5, image: "img2.jpg", category: "Burger", description: "Juicy" },
        ],
      }),
    );
    useCartStore.setState({ items: { f1: 2, f2: 1 } });

    render(<CheckoutPage />, { wrapper: createWrapper() });

    // Wait for data to load, form should appear
    const heading = await screen.findByText("Delivery Information");
    expect(heading).toBeDefined();

    // Check key form labels
    expect(screen.getByLabelText("First Name")).toBeDefined();
    expect(screen.getByLabelText("Last Name")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Street Address")).toBeDefined();
    expect(screen.getByLabelText("City")).toBeDefined();
    expect(screen.getByLabelText("State")).toBeDefined();
    expect(screen.getByLabelText("Zip Code")).toBeDefined();
    expect(screen.getByLabelText("Country")).toBeDefined();
    expect(screen.getByLabelText("Phone")).toBeDefined();

    // Order summary
    expect(screen.getByText("Cart Totals")).toBeDefined();
    // Total: 12*2 + 8.5*1 + 2 delivery = 34.50
    expect(screen.getByText("$34.50")).toBeDefined();
  });

  it("shows error state when food fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));
    useCartStore.setState({ items: { f1: 1 } });

    render(<CheckoutPage />, { wrapper: createWrapper() });

    const heading = await screen.findByText("Something went wrong");
    expect(heading).toBeDefined();
    expect(screen.getByText("Back to Home")).toBeDefined();
  });

  it("has a 'Back to Cart' link", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        data: [{ _id: "f1", name: "Pizza", price: 12, image: "img.jpg", category: "Pizza", description: "Tasty" }],
      }),
    );
    useCartStore.setState({ items: { f1: 1 } });

    render(<CheckoutPage />, { wrapper: createWrapper() });

    const link = await screen.findByText("Back to Cart");
    expect(link.getAttribute("href")).toBe("/cart");
  });
});
