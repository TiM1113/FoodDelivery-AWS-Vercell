import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryFilter } from "../category-filter";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("CategoryFilter", () => {
  it("renders All button and all 8 categories", () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected="All" onSelect={onSelect} />);

    expect(screen.getByText("Explore our menu")).toBeInTheDocument();
    // "All" appears as the label (emoji replaced the text in the circle)
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Salad")).toBeInTheDocument();
    expect(screen.getByText("Rolls")).toBeInTheDocument();
    expect(screen.getByText("Deserts")).toBeInTheDocument();
    expect(screen.getByText("Sandwich")).toBeInTheDocument();
    expect(screen.getByText("Cake")).toBeInTheDocument();
    expect(screen.getByText("Pure Veg")).toBeInTheDocument();
    expect(screen.getByText("Pasta")).toBeInTheDocument();
    expect(screen.getByText("Noodles")).toBeInTheDocument();
  });

  it("calls onSelect with category name when clicked", () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected="All" onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Pasta"));
    expect(onSelect).toHaveBeenCalledWith("Pasta");
  });

  it("calls onSelect with 'All' when clicking the already selected category (toggle off)", () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected="Pasta" onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Pasta"));
    expect(onSelect).toHaveBeenCalledWith("All");
  });

  it("calls onSelect with 'All' when clicking the All button", () => {
    const onSelect = vi.fn();
    render(<CategoryFilter selected="Pasta" onSelect={onSelect} />);

    // The All button's label text
    const allButtons = screen.getAllByText("All");
    fireEvent.click(allButtons[0]);
    expect(onSelect).toHaveBeenCalledWith("All");
  });
});
