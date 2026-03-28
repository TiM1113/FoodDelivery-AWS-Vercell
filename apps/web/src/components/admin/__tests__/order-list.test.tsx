import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { OrderList } from "../order-list";
import { jsonResponse, pendingResponse } from "@/test/http";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOrders = [
  {
    _id: "ord1",
    items: [
      { name: "Pizza", quantity: 2 },
      { name: "Salad", quantity: 1 },
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
    amount: 38,
    status: "Food Processing",
    payment: true,
  },
  {
    _id: "ord2",
    items: [{ name: "Cake", quantity: 1 }],
    address: {
      firstName: "Jane",
      lastName: "Smith",
      street: "456 Oak Ave",
      city: "Sydney",
      state: "NSW",
      country: "Australia",
      zipcode: "2000",
      phone: "0498765432",
    },
    amount: 15,
    status: "Payment Pending",
    payment: false,
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("OrderList", () => {
  it("shows loading skeleton initially", () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() => pendingResponse());
    global.fetch = fetchMock;

    render(<OrderList />);

    const skeletons = document.querySelectorAll("[class*='animate-pulse'], [data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders orders after loading", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("shows heading", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });
  });

  it("shows empty state when no orders", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: [] }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("No orders found.")).toBeInTheDocument();
    });
  });

  it("displays order amounts with dollar sign", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("$38")).toBeInTheDocument();
    });

    expect(screen.getByText("$15")).toBeInTheDocument();
  });

  it("displays order item summaries", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("2 item(s)")).toBeInTheDocument();
    });

    expect(screen.getByText("1 item(s)")).toBeInTheDocument();
  });

  it("displays payment badges", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("Paid")).toBeInTheDocument();
    });

    expect(screen.getByText("Unpaid")).toBeInTheDocument();
  });

  it("shows customer city and state", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("Melbourne, VIC")).toBeInTheDocument();
    });

    expect(screen.getByText("Sydney, NSW")).toBeInTheDocument();
  });

  it("shows matching order count", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("2 matching order(s)")).toBeInTheDocument();
    });
  });

  it("shows pagination controls", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockOrders }),
    );
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(screen.getByText("Orders")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
  });

  it("shows error toast on fetch failure", async () => {
    const { toast } = await import("sonner");
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error("Network error"));
    global.fetch = fetchMock;

    render(<OrderList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error connecting to server");
    });
  });
});
