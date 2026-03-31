import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderList } from "../order-list";
import type { Order } from "@/types/order";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const { mockToast } = vi.hoisted(() => ({
  mockToast: { success: vi.fn(), error: vi.fn() },
}));
vi.mock("sonner", () => ({
  toast: mockToast,
}));

const mockOrders: Order[] = [
  {
    _id: "order1",
    userId: "user-1",
    items: [{ _id: "f1", name: "Pizza", price: 14, quantity: 2 }],
    address: {
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
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
    userId: "user-1",
    items: [{ _id: "f2", name: "Salad", price: 15, quantity: 1 }],
    address: {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
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
  localStorage.clear();
});

describe("OrderList (myorders)", () => {
  it("renders tab navigation", () => {
    renderWithQuery(<OrderList initialOrders={mockOrders} />);

    expect(screen.getByText("Recent Orders")).toBeInTheDocument();
    expect(screen.getByText("Favourites")).toBeInTheDocument();
  });

  it("renders all orders in Recent tab by default", () => {
    renderWithQuery(<OrderList initialOrders={mockOrders} />);

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("Salad")).toBeInTheDocument();
  });

  it("shows empty state when no orders", () => {
    renderWithQuery(<OrderList initialOrders={[]} />);

    expect(screen.getByText("No orders found.")).toBeInTheDocument();
  });

  it("shows favourites empty state when switching to Favourites tab", () => {
    renderWithQuery(<OrderList initialOrders={mockOrders} />);

    fireEvent.click(screen.getByText("Favourites"));

    expect(
      screen.getByText("No favourite orders yet. Star an order to add it here!"),
    ).toBeInTheDocument();
  });

  it("shows favourited orders in Favourites tab", () => {
    localStorage.setItem("myorders:favourites", JSON.stringify(["order1"]));

    renderWithQuery(<OrderList initialOrders={mockOrders} />);

    fireEvent.click(screen.getByText("Favourites"));

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.queryByText("Salad")).not.toBeInTheDocument();
  });

  it("does not show polling indicator (silent refresh)", () => {
    renderWithQuery(<OrderList initialOrders={mockOrders} />);

    // Polling still works in background, but no visible indicator
    expect(screen.queryByText("Auto-refreshing active orders")).not.toBeInTheDocument();
  });

  it("shows toast when order status changes on refetch", async () => {
    const activeOrder: Order = {
      _id: "order3",
      userId: "user-1",
      items: [{ _id: "f3", name: "Burger", price: 20, quantity: 1 }],
      address: {
        firstName: "Tim",
        lastName: "Y",
        email: "tim@example.com",
        street: "789 Elm",
        city: "Melbourne",
        state: "VIC",
        country: "AU",
        zipcode: "3000",
        phone: "0422222222",
      },
      amount: 20,
      status: "Food Processing",
      payment: true,
    };

    const updatedOrder: Order = {
      ...activeOrder,
      status: "Out for Delivery",
    };

    // First render with "Food Processing" status
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [updatedOrder] }),
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <OrderList initialOrders={[activeOrder]} />
      </QueryClientProvider>,
    );

    // Trigger refetch to simulate status change
    await queryClient.invalidateQueries({ queryKey: ["userOrders"] });

    rerender(
      <QueryClientProvider client={queryClient}>
        <OrderList initialOrders={[activeOrder]} />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith(
        "Your order is out for delivery!",
        expect.objectContaining({
          description: expect.stringContaining("Burger"),
        }),
      );
    });
  });
});
