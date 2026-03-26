import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CartPage from "../../cart/page";
import { useCartStore } from "@/lib/store/cart-store";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

const mockFoods = [
  { _id: "f1", name: "Pizza", description: "Tasty", price: 14, image: "/pizza.png", category: "Pasta" },
  { _id: "f2", name: "Salad", description: "Fresh", price: 10, image: "/salad.png", category: "Salad" },
];

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.restoreAllMocks();
  useCartStore.setState({ items: {} });
});

describe("CartPage", () => {
  it("shows loading state", () => {
    global.fetch = vi.fn(() => new Promise(() => {}));

    renderWithQuery(<CartPage />);

    expect(screen.getByText("Loading your cart…")).toBeInTheDocument();
  });

  it("shows empty cart message when no items", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    renderWithQuery(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Your cart is empty")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Browse Menu" })).toHaveAttribute("href", "/");
  });

  it("shows cart items when cart has items", async () => {
    useCartStore.setState({ items: { f1: 2, f2: 1 } });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    renderWithQuery(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Cart")).toBeInTheDocument();
    });

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("Salad")).toBeInTheDocument();
  });

  it("shows cart totals with delivery fee", async () => {
    useCartStore.setState({ items: { f1: 1 } });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    renderWithQuery(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Cart Totals")).toBeInTheDocument();
    });

    // Subtotal = 14, Delivery = 2, Total = 16
    expect(screen.getByText("$2.00")).toBeInTheDocument();
    expect(screen.getByText("$16.00")).toBeInTheDocument();
  });

  it("shows checkout link", async () => {
    useCartStore.setState({ items: { f1: 1 } });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    renderWithQuery(<CartPage />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Proceed to Checkout" })).toHaveAttribute(
        "href",
        "/checkout",
      );
    });
  });

  it("shows promo code input", async () => {
    useCartStore.setState({ items: { f1: 1 } });

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    renderWithQuery(<CartPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Promo code")).toBeInTheDocument();
    });
  });

  it("shows error state when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    renderWithQuery(<CartPage />);

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    expect(screen.getByRole("link", { name: "Back to Home" })).toHaveAttribute("href", "/");
  });
});
