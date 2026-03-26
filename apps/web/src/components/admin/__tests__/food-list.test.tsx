import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { FoodList } from "../food-list";

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
    // Mock fetch that never resolves to keep loading state
    global.fetch = vi.fn(() => new Promise(() => {}));

    render(<FoodList />);

    // Skeleton elements should be present
    const skeletons = document.querySelectorAll("[class*='animate-pulse'], [data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders food items after loading", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    });

    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("Chocolate Cake")).toBeInTheDocument();
  });

  it("shows heading and search input after loading", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("All Food Items")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("Search by name...")).toBeInTheDocument();
  });

  it("shows empty state when no food items", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("No food items found.")).toBeInTheDocument();
    });
  });

  it("displays prices with dollar sign", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("$14")).toBeInTheDocument();
    });

    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(screen.getByText("$8")).toBeInTheDocument();
  });

  it("shows item count", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

    render(<FoodList />);

    await waitFor(() => {
      expect(screen.getByText("3 item(s) total")).toBeInTheDocument();
    });
  });

  it("shows pagination controls", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockFoods }),
    });

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
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network error"));

    render(<FoodList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Error connecting to server");
    });
  });

  it("shows error toast on API error response", async () => {
    const { toast } = await import("sonner");
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, message: "Unauthorized" }),
    });

    render(<FoodList />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Unauthorized");
    });
  });
});
