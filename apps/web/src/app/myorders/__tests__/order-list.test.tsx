import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Order } from "@/types/order";
import { OrderList } from "../order-list";

// Mock localStorage for test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
});

// Mock child components to isolate OrderList logic
vi.mock("../order-card", () => ({
  OrderCard: ({
    order,
    orderNumber,
  }: {
    order: Order;
    orderNumber: number;
  }) => (
    <div data-testid={`order-card-${order._id}`}>
      Order #{orderNumber}: {order.items[0]?.name} - ${order.amount}
    </div>
  ),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockOrders: Order[] = [
  {
    _id: "6612a1b2c3d4e5f6a7b8c9d0",
    userId: "user1",
    items: [{ _id: "f1", name: "Pizza", price: 12, quantity: 2 }],
    amount: 26,
    address: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      street: "123 Main St",
      city: "Melbourne",
      state: "VIC",
      zipcode: "3000",
      country: "Australia",
      phone: "+61412345678",
    },
    status: "Delivered",
    payment: true,
  },
  {
    _id: "6612a1b2c3d4e5f6a7b8c9d1",
    userId: "user1",
    items: [{ _id: "f2", name: "Burger", price: 8, quantity: 1 }],
    amount: 10,
    address: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      street: "123 Main St",
      city: "Melbourne",
      state: "VIC",
      zipcode: "3000",
      country: "Australia",
      phone: "+61412345678",
    },
    status: "Payment Pending",
    payment: false,
  },
];

describe("OrderList", () => {
  it("renders order cards for each order", () => {
    render(<OrderList initialOrders={mockOrders} />);

    expect(screen.getByTestId("order-card-6612a1b2c3d4e5f6a7b8c9d0")).toBeInTheDocument();
    expect(screen.getByTestId("order-card-6612a1b2c3d4e5f6a7b8c9d1")).toBeInTheDocument();
  });

  it("shows empty state when no orders", () => {
    render(<OrderList initialOrders={[]} />);

    expect(screen.getByText("No orders found.")).toBeInTheDocument();
  });

  it("shows favourites empty state on favourites tab", async () => {
    const user = userEvent.setup();
    render(<OrderList initialOrders={mockOrders} />);

    await user.click(screen.getByText("Favourites"));

    expect(
      screen.getByText("No favourite orders yet. Star an order to add it here!"),
    ).toBeInTheDocument();
  });

  it("switches between Recent and Favourites tabs", async () => {
    const user = userEvent.setup();
    render(<OrderList initialOrders={mockOrders} />);

    // Initially on Recent tab — orders visible
    expect(screen.getByTestId("order-card-6612a1b2c3d4e5f6a7b8c9d0")).toBeInTheDocument();

    // Switch to Favourites
    await user.click(screen.getByText("Favourites"));
    expect(screen.queryByTestId("order-card-6612a1b2c3d4e5f6a7b8c9d0")).not.toBeInTheDocument();

    // Switch back to Recent
    await user.click(screen.getByText("Recent Orders"));
    expect(screen.getByTestId("order-card-6612a1b2c3d4e5f6a7b8c9d0")).toBeInTheDocument();
  });
});
