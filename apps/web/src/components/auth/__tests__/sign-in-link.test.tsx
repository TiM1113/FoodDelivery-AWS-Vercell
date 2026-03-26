import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignInLink } from "../sign-in-link";

describe("SignInLink", () => {
  it("renders a link to /login", () => {
    render(<SignInLink />);

    const link = screen.getByRole("link", { name: "Sign In" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });
});
