import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminSidebar } from "../admin-sidebar";

const mockPathname = vi.fn(() => "/admin");

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("AdminSidebar", () => {
  it("renders all navigation items", () => {
    render(<AdminSidebar />);

    expect(screen.getByText("List Items")).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByText("Orders")).toBeInTheDocument();
  });

  it("renders correct hrefs", () => {
    render(<AdminSidebar />);

    expect(screen.getByRole("link", { name: /List Items/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: /Add Item/i })).toHaveAttribute("href", "/admin/add");
    expect(screen.getByRole("link", { name: /Orders/i })).toHaveAttribute("href", "/admin/orders");
  });

  it("highlights the active link for /admin", () => {
    mockPathname.mockReturnValue("/admin");
    render(<AdminSidebar />);

    const activeLink = screen.getByRole("link", { name: /List Items/i });
    expect(activeLink.className).toContain("bg-primary");
  });

  it("highlights the active link for /admin/add", () => {
    mockPathname.mockReturnValue("/admin/add");
    render(<AdminSidebar />);

    const activeLink = screen.getByRole("link", { name: /Add Item/i });
    expect(activeLink.className).toContain("bg-primary");

    const inactiveLink = screen.getByRole("link", { name: /List Items/i });
    expect(inactiveLink.className).not.toContain("bg-primary");
  });

  it("highlights the active link for /admin/orders", () => {
    mockPathname.mockReturnValue("/admin/orders");
    render(<AdminSidebar />);

    const activeLink = screen.getByRole("link", { name: /Orders/i });
    expect(activeLink.className).toContain("bg-primary");
  });
});
