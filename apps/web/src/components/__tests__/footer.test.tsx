import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../footer";

vi.mock("next/image", () => ({
  default: function MockImage(props: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("Footer", () => {
  it("renders company name and description", () => {
    render(<Footer />);

    expect(screen.getByText("Tomato")).toBeInTheDocument();
    expect(screen.getByText(/food delivery platform/i)).toBeInTheDocument();
  });

  it("renders social media icons", () => {
    render(<Footer />);

    expect(screen.getByAltText("Facebook")).toBeInTheDocument();
    expect(screen.getByAltText("Twitter")).toBeInTheDocument();
    expect(screen.getByAltText("LinkedIn")).toBeInTheDocument();
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
});
