import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SignOutButton } from "../sign-out-button";

const mockSignOut = vi.fn();

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

describe("SignOutButton", () => {
  it("renders a Sign Out button", () => {
    render(<SignOutButton />);

    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });

  it("calls signOut with callbackUrl on click", () => {
    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });
});
