import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderList } from "../order-list";
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

const mockOrders: Order[] = [
  {
    _id: "order1",
    items: [{ _id: "f1", name: "Pizza", quantity: 2 }],
    address: {
      firstName: "John",
      lastName: "Doe",
      street: "123 Main",
      city: "Melbourne",
      state: "VIC",
      country: "AU",
      zipcode: "3000",
      phone: "0400000000",
    },
    amount: 28,
    status: "Delivered",
    payment: true,
  },
  {
    _id: "order2",
    items: [{ _id: "f2", name: "Salad", quantity: 1 }],
    address: {
      firstName: "Jane",
      lastName: "Smith",
      street: "456 Oak",
      city: "Sydney",
      state: "NSW",
      country: "AU",
      zipcode: "2000",
      phone: "0411111111",
    },
    amount: 15,
    status: "Food Processing",
    payment: true,
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("OrderList (myorders)", () => {
  it("renders tab navigation", () => {
    render(<OrderList initialOrders={mockOrders} />);

    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    expect(screen.getByText("Favourites")).toBeInTheDocument();
  });

  it("renders all orders in Recent tab by default", () => {
    render(<OrderList initialOrders={mockOrders} />);

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("Salad")).toBeInTheDocument();
  });

  it("shows empty state when no orders", () => {
    render(<OrderList initialOrders={[]} />);

    expect(screen.getByText("No orders found.")).toBeInTheDocument();
  });

  it("shows favourites empty state when switching to Favourites tab", () => {
    render(<OrderList initialOrders={mockOrders} />);

    fireEvent.click(screen.getByText("Favourites"));

    expect(
      screen.getByText("No favourite orders yet. Star an order to add it here!"),
    ).toBeInTheDocument();
  });

  it("shows favourited orders in Favourites tab", () => {
    // Pre-set a favourite in localStorage
    localStorage.setItem("myorders:favourites", JSON.stringify(["order1"]));

    render(<OrderList initialOrders={mockOrders} />);

    fireEvent.click(screen.getByText("Favourites"));

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.queryByText("Salad")).not.toBeInTheDocument();
  });
});
