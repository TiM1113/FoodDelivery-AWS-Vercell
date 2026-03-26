import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderTrackingDialog } from "../order-tracking-dialog";
import type { Order } from "@/types/order";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const paidOrder: Order = {
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
  status: "Out for Delivery",
  payment: true,
};

const unpaidOrder: Order = {
  ...paidOrder,
  payment: false,
  status: "Payment Pending",
};

describe("OrderTrackingDialog", () => {
  it("renders dialog with order info when open", () => {
    render(
      <OrderTrackingDialog
        order={paidOrder}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Order Tracking")).toBeInTheDocument();
    expect(screen.getByText("$38.50")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows tracking steps for paid orders", () => {
    render(
      <OrderTrackingDialog
        order={paidOrder}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Food Processing")).toBeInTheDocument();
    expect(screen.getByText("Out for Delivery")).toBeInTheDocument();
    expect(screen.getByText("Delivered")).toBeInTheDocument();
  });

  it("shows Payment Required warning for unpaid orders", () => {
    render(
      <OrderTrackingDialog
        order={unpaidOrder}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Payment Required")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Complete Payment/i }),
    ).toBeInTheDocument();
  });

  it("lists order items", () => {
    render(
      <OrderTrackingDialog
        order={paidOrder}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("x 2")).toBeInTheDocument();
    expect(screen.getByText("Salad")).toBeInTheDocument();
    expect(screen.getByText("x 1")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(
      <OrderTrackingDialog
        order={paidOrder}
        open={false}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.queryByText("Order Tracking")).not.toBeInTheDocument();
  });

  it("shows order ID", () => {
    render(
      <OrderTrackingDialog
        order={paidOrder}
        open={true}
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText(paidOrder._id!)).toBeInTheDocument();
  });
});
