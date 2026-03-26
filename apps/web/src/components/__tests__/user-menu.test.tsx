import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "../user-menu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("UserMenu", () => {
  it("renders trigger button with user name", () => {
    render(<UserMenu name="Tim" isAdmin={false} />);

    expect(screen.getByRole("button", { name: "Tim menu" })).toBeInTheDocument();
    expect(screen.getByText("Tim")).toBeInTheDocument();
  });

  it("renders trigger with generic label when no name", () => {
    render(<UserMenu name="" isAdmin={false} />);

    expect(screen.getByRole("button", { name: "User menu" })).toBeInTheDocument();
  });
});
