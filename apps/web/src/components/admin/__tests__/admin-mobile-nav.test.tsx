import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AdminMobileNav } from "../admin-mobile-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin",
}));

describe("AdminMobileNav", () => {
  it("renders the toggle button", () => {
    render(<AdminMobileNav />);

    expect(screen.getByRole("button", { name: "Open admin menu" })).toBeInTheDocument();
  });

  it("does not show navigation links initially", () => {
    render(<AdminMobileNav />);

    expect(screen.queryByText("List Items")).not.toBeInTheDocument();
  });

  it("shows navigation links when toggle button is clicked", () => {
    render(<AdminMobileNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open admin menu" }));

    expect(screen.getByText("List Items")).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("closes the menu when a link is clicked", () => {
    render(<AdminMobileNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open admin menu" }));
    expect(screen.getByText("List Items")).toBeInTheDocument();

    fireEvent.click(screen.getByText("List Items"));
    expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
  });

  it("closes the menu when the backdrop is clicked", () => {
    render(<AdminMobileNav />);

    fireEvent.click(screen.getByRole("button", { name: "Open admin menu" }));
    expect(screen.getByText("List Items")).toBeInTheDocument();

    // Click the backdrop (the overlay div)
    fireEvent.click(screen.getByRole("button", { name: "Close admin menu" }));
    expect(screen.queryByText("List Items")).not.toBeInTheDocument();
  });

  it("updates aria-expanded when menu is toggled", () => {
    render(<AdminMobileNav />);

    const button = screen.getByRole("button", { name: "Open admin menu" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(button);

    const closeButton = screen.getByRole("button", { name: "Close admin menu" });
    expect(closeButton).toHaveAttribute("aria-expanded", "true");
  });
});
