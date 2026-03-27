import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../footer";

describe("Footer", () => {
  it("renders company name and description", () => {
    render(<Footer />);

    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.getByText(/food delivery platform/i)).toBeInTheDocument();
  });

  it("renders social media links to platform homepages", () => {
    render(<Footer />);

    const fbLink = screen.getByRole("link", { name: "Facebook" });
    expect(fbLink).toHaveAttribute("href", "https://www.facebook.com");
    expect(fbLink).toHaveAttribute("target", "_blank");

    const xLink = screen.getByRole("link", { name: "X" });
    expect(xLink).toHaveAttribute("href", "https://www.x.com");
    expect(xLink).toHaveAttribute("target", "_blank");

    const igLink = screen.getByRole("link", { name: "Instagram" });
    expect(igLink).toHaveAttribute("href", "https://www.instagram.com");
    expect(igLink).toHaveAttribute("target", "_blank");
  });

  it("renders contact information", () => {
    render(<Footer />);

    expect(screen.getByText("contact@tomato.com")).toBeInTheDocument();
    expect(screen.getByText("+61-000-000-0000")).toBeInTheDocument();
  });

  it("renders copyright with current year", () => {
    render(<Footer />);

    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`${year}`))).toBeInTheDocument();
  });

  it("renders legal page links", () => {
    render(<Footer />);

    const privacyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(privacyLink).toHaveAttribute("href", "/privacy");

    const termsLink = screen.getByRole("link", { name: /terms of service/i });
    expect(termsLink).toHaveAttribute("href", "/terms");
  });
});
