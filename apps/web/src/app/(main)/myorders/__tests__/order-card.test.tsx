import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderCard } from "../order-card";
import type { Order } from "@/types/order";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../order-tracking-dialog", () => ({
  OrderTrackingDialog: () => null,
}));

vi.mock("../edit-order-dialog", () => ({
  EditOrderDialog: () => null,
}));

const mockOrder: Order = {
  _id: "67890abc12345678deadbeef",
  items: [
    { _id: "f1", name: "Pizza", quantity: 2 },
    { _id: "f2", name: "Salad", quantity: 1 },
  ],
  address: {
    firstName: "John",
    lastName: "Doe",
    street: "123 Main St",
    city: "Melbourne",
    state: "VIC",
    country: "Australia",
    zipcode: "3000",
    phone: "0412345678",
  },
  amount: 38.5,
  status: "Food Processing",
  payment: true,
};

const unpaidOrder: Order = {
  ...mockOrder,
  _id: "67890abc12345678deadbee0",
  payment: false,
  status: "Payment Pending",
};

const defaultProps = {
  orderNumber: 1,
  isFavourite: false,
  onToggleFavourite: vi.fn(),
  onRefresh: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OrderCard", () => {
  it("renders the first item name", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.getByText("Pizza")).toBeInTheDocument();
  });

  it("shows +N more when multiple items", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.getByText("+1 more")).toBeInTheDocument();
  });

  it("displays order amount", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.getByText("$38.50")).toBeInTheDocument();
  });

  it("displays order status badge for paid orders", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.getByText("Food Processing")).toBeInTheDocument();
  });

  it("displays Payment Pending badge for unpaid orders", () => {
    render(<OrderCard order={unpaidOrder} {...defaultProps} />);

    expect(screen.getByText("Payment Pending")).toBeInTheDocument();
  });

  it("shows order number", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} orderNumber={5} />);

    expect(screen.getByText("Order #5")).toBeInTheDocument();
  });

  it("shows Track button", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Track/i })).toBeInTheDocument();
  });

  it("shows Reorder button", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Reorder/i })).toBeInTheDocument();
  });

  it("shows Edit and Delete buttons for unpaid orders", () => {
    render(<OrderCard order={unpaidOrder} {...defaultProps} />);

    expect(screen.getByRole("button", { name: /Edit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
  });

  it("does not show Edit and Delete buttons for paid orders", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    expect(screen.queryByRole("button", { name: /Edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Delete/i })).not.toBeInTheDocument();
  });

  it("expands to show item details when expand button is clicked", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    // Items should not be visible initially
    expect(screen.queryByText("Items:")).not.toBeInTheDocument();

    // Click expand - find the last button (chevron)
    const buttons = screen.getAllByRole("button");
    const expandButton = buttons[buttons.length - 1];
    fireEvent.click(expandButton);

    expect(screen.getByText("Items:")).toBeInTheDocument();
    expect(screen.getByText("x 2")).toBeInTheDocument();
    expect(screen.getByText("x 1")).toBeInTheDocument();
  });

  it("calls onToggleFavourite when star is clicked", () => {
    const onToggle = vi.fn();
    render(
      <OrderCard order={mockOrder} {...defaultProps} onToggleFavourite={onToggle} />,
    );

    const starButton = screen.getByTitle("Add to favourites");
    fireEvent.click(starButton);

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("shows filled star when favourite", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} isFavourite={true} />);

    expect(screen.getByTitle("Remove from favourites")).toBeInTheDocument();
  });

  it("shows order ID suffix", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    // slice(-6) of "67890abc12345678deadbeef" = "adbeef"
    expect(screen.getByText("#adbeef")).toBeInTheDocument();
  });
});
