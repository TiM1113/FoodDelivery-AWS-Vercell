import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FoodSection } from "../food-section";
import type { Food } from "@/types/food";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "u1" } } }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockFoods: Food[] = [
  { _id: "1", name: "Margherita Pizza", description: "Classic Italian", price: 14, image: "/pizza.png", category: "Pasta" },
  { _id: "2", name: "Caesar Salad", description: "Fresh romaine", price: 10, image: "/salad.png", category: "Salad" },
  { _id: "3", name: "Chocolate Cake", description: "Rich cocoa", price: 8, image: "/cake.png", category: "Cake" },
];

beforeEach(() => {
  vi.restoreAllMocks();
  // Mock fetch to return paginated results
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const params = new URL(url, "http://localhost").searchParams;
    let result = [...mockFoods];

    const q = params.get("q");
    if (q) {
      const lower = q.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.description.toLowerCase().includes(lower),
      );
    }

    const category = params.get("category");
    if (category) {
      result = result.filter((f) => f.category === category);
    }

    const sortBy = params.get("sortBy");
    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "name_asc") result.sort((a, b) => a.name.localeCompare(b.name));

    return Promise.resolve(
      Response.json({
        success: true,
        data: result,
        count: result.length,
        nextCursor: null,
      }),
    );
  });
});

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

describe("FoodSection", () => {
  it("renders all initial foods", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.getByText("Chocolate Cake")).toBeInTheDocument();
  });

  it("filters foods by category via server query", async () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    fireEvent.click(screen.getByText("Salad"));

    await waitFor(() => {
      expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
      expect(screen.queryByText("Margherita Pizza")).not.toBeInTheDocument();
    });
  });

  it("searches foods with debounced server query", async () => {
    vi.useFakeTimers();
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    const searchInput = screen.getByPlaceholderText("Search dishes...");
    fireEvent.change(searchInput, { target: { value: "pizza" } });

    // Advance past debounce
    vi.advanceTimersByTime(400);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
      expect(screen.queryByText("Caesar Salad")).not.toBeInTheDocument();
    });
  });

  it("shows 'All dishes' heading when no category is selected", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    expect(screen.getByText("All dishes")).toBeInTheDocument();
  });

  it("shows category name in heading when a category is selected", async () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    fireEvent.click(screen.getByText("Cake"));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 2, name: "Cake" }),
      ).toBeInTheDocument();
    });
  });

  it("has sort dropdown with options", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    const sortSelect = screen.getByLabelText("Sort dishes");
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveValue("newest");
  });

  it("clears search when X button is clicked", async () => {
    vi.useFakeTimers();
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    const searchInput = screen.getByPlaceholderText("Search dishes...");
    fireEvent.change(searchInput, { target: { value: "pizza" } });

    vi.advanceTimersByTime(400);
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByLabelText("Clear search")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Clear search"));

    expect(searchInput).toHaveValue("");
  });

  it("does not show Load More when no nextCursor", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    expect(screen.queryByText("Load More")).not.toBeInTheDocument();
  });
});
