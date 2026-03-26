import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FoodSection } from "../food-section";
import type { Food } from "@/types/food";

// Mock child components that are hard to test in isolation
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

  it("filters foods by category", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    fireEvent.click(screen.getByText("Salad"));

    expect(screen.getByText("Caesar Salad")).toBeInTheDocument();
    expect(screen.queryByText("Margherita Pizza")).not.toBeInTheDocument();
    expect(screen.queryByText("Chocolate Cake")).not.toBeInTheDocument();
  });

  it("filters foods by search query", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    const searchInput = screen.getByPlaceholderText("Search dishes...");
    fireEvent.change(searchInput, { target: { value: "pizza" } });

    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.queryByText("Caesar Salad")).not.toBeInTheDocument();
    expect(screen.queryByText("Chocolate Cake")).not.toBeInTheDocument();
  });

  it("shows empty state when no foods match search", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    const searchInput = screen.getByPlaceholderText("Search dishes...");
    fireEvent.change(searchInput, { target: { value: "sushi" } });

    expect(screen.getByText("No dishes found")).toBeInTheDocument();
  });

  it("shows 'All dishes' heading when no category is selected", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    expect(screen.getByText("All dishes")).toBeInTheDocument();
  });

  it("shows category name in heading when a category is selected", () => {
    renderWithQuery(<FoodSection initialFoods={mockFoods} />);

    fireEvent.click(screen.getByText("Cake"));

    expect(screen.queryByText("All dishes")).not.toBeInTheDocument();
    // "Cake" appears in: category filter label + heading. Just verify heading exists.
    expect(screen.getByRole("heading", { level: 2, name: "Cake" })).toBeInTheDocument();
  });
});
