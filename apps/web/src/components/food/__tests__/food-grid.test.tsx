import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FoodGrid } from "../food-grid";
import type { Food } from "@/types/food";

// next/image renders a plain <img> in the test environment
vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

const mockFoods: Food[] = [
  { _id: "1", name: "Pizza", description: "Cheesy", price: 12, image: "/img.png", category: "Pasta" },
  { _id: "2", name: "Salad Bowl", description: "Fresh", price: 8, image: "/salad.png", category: "Salad" },
];

describe("FoodGrid", () => {
  it("renders food cards when foods are provided", () => {
    render(<FoodGrid foods={mockFoods} />);

    expect(screen.getByText("Pizza")).toBeInTheDocument();
    expect(screen.getByText("Salad Bowl")).toBeInTheDocument();
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByText("$8.00")).toBeInTheDocument();
  });

  it("shows empty state when no foods provided", () => {
    render(<FoodGrid foods={[]} />);

    expect(screen.getByText("No dishes found")).toBeInTheDocument();
    expect(screen.getByText(/Try selecting a different category/)).toBeInTheDocument();
  });

  it("passes renderAction to each food card", () => {
    render(
      <FoodGrid
        foods={mockFoods}
        renderAction={(foodId) => <button data-testid={`action-${foodId}`}>Add</button>}
      />,
    );

    expect(screen.getByTestId("action-1")).toBeInTheDocument();
    expect(screen.getByTestId("action-2")).toBeInTheDocument();
  });
});
