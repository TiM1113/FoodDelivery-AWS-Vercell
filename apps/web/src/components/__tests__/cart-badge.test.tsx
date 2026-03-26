import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CartBadge } from "../cart-badge";
import { useCartStore } from "@/lib/store/cart-store";

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

beforeEach(() => {
  useCartStore.setState({ items: {} });
});

describe("CartBadge", () => {
  it("renders cart link without count badge when cart is empty", () => {
    render(<CartBadge />);

    const link = screen.getByRole("link", { name: "Cart" });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute("href")).toBe("/cart");
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it("shows count badge when cart has items", () => {
    useCartStore.setState({ items: { food1: 2, food2: 3 } });

    render(<CartBadge />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows 99+ when count exceeds 99", () => {
    // Create items that sum to > 99
    const items: Record<string, number> = {};
    for (let i = 0; i < 10; i++) {
      items[`food${i}`] = 10;
    }
    useCartStore.setState({ items });

    render(<CartBadge />);

    expect(screen.getByText("99+")).toBeInTheDocument();
  });
});
