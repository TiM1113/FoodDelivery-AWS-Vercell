import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FoodList } from "../food-list";
import { jsonResponse, pendingResponse } from "@/test/http";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockFoods = [
  { _id: "1", name: "Margherita Pizza", description: "Classic", price: 14, category: "Pasta", image: "pizza.png" },
  { _id: "2", name: "Caesar Salad", description: "Fresh", price: 10, category: "Salad", image: "salad.png" },
  { _id: "3", name: "Chocolate Cake", description: "Rich", price: 8, category: "Cake", image: "cake.png" },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("FoodList", () => {
  it("shows loading skeleton initially", () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(() => pendingResponse());
    global.fetch = fetchMock;

    render(<FoodList />);

    // Skeleton elements should be present
    const skeletons = document.querySelectorAll("[class*='animate-pulse'], [data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders food items after loading", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockFoods }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    });

    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("Chocolate Cake")).toBeInTheDocument();
  });

  it("shows heading and search input after loading", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockFoods }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("All Food Items")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
  });

  it("shows empty state when no food items", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: [] }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("No food items found.")).toBeInTheDocument();
    });
  });

  it("displays prices with dollar sign", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockFoods }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("$14.00")).toBeInTheDocument();
    });

    expect(screen.getByText("$10.00")).toBeInTheDocument();
    expect(screen.getByText("$8.00")).toBeInTheDocument();
  });

  it("shows item count", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockFoods }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("3 item(s) total")).toBeInTheDocument();
    });
  });

  it("shows pagination controls", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: true, data: mockFoods }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("All Food Items")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Previous page")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
  });

  it("shows error toast on fetch failure", async () => {
    const { toast } = await import("sonner");
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error("Network error"));
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error connecting to server");
    });
  });

  it("shows error toast on API error response", async () => {
    const { toast } = await import("sonner");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      jsonResponse({ success: false, message: "Unauthorized" }),
    );
    global.fetch = fetchMock;

    render(<FoodList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized");
    });
  });
});
