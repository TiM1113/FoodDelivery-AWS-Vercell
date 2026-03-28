import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  userId: "user-1",
  items: [
    { _id: "f1", name: "Pizza", price: 14, quantity: 2 },
    { _id: "f2", name: "Salad", price: 10, quantity: 1 },
  ],
  address: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
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

const cancelledOrder: Order = {
  ...mockOrder,
  _id: "67890abc12345678deadbee1",
  status: "Cancelled",
};

const deliveredOrder: Order = {
  ...mockOrder,
  _id: "67890abc12345678deadbee2",
  status: "Delivered",
};

describe("OrderCard cancel functionality", () => {
  it("shows Cancel button for paid Food Processing order", () => {
    render(<OrderCard order={mockOrder} {...defaultProps} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("shows Cancel button for unpaid Payment Pending order", () => {
    render(<OrderCard order={unpaidOrder} {...defaultProps} />);
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("does not show Cancel button for Delivered orders", () => {
    render(<OrderCard order={deliveredOrder} {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });

  it("does not show Cancel button for already Cancelled orders", () => {
    render(<OrderCard order={cancelledOrder} {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
  });

  it("shows Cancelled badge for cancelled orders", () => {
    render(<OrderCard order={cancelledOrder} {...defaultProps} />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });

  it("hides Edit and Delete buttons for cancelled orders", () => {
    render(<OrderCard order={cancelledOrder} {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("shows refund message in cancel dialog for paid orders", async () => {
    const user = userEvent.setup();
    render(<OrderCard order={mockOrder} {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.getByText(/refund will be issued/i)).toBeInTheDocument();
    });
  });

  it("calls cancel API and refreshes on confirm", async () => {
    const user = userEvent.setup();
    const mockRefresh = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, message: "Order cancelled" }),
    );

    render(
      <OrderCard order={mockOrder} {...defaultProps} onRefresh={mockRefresh} />,
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    // Wait for the dialog to open — use the action button as indicator
    const cancelBtn = await screen.findByRole("button", { name: /cancel order/i });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
