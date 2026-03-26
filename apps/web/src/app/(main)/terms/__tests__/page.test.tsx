import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import TermsOfServicePage from "../page";

describe("TermsOfServicePage", () => {
  it("renders the page title", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByText("Terms of Service")).toBeInTheDocument();
  });

  it("renders all section headings", () => {
    render(<TermsOfServicePage />);

    expect(screen.getByText("1. Acceptance of Terms")).toBeInTheDocument();
    expect(screen.getByText("2. Account Registration")).toBeInTheDocument();
    expect(screen.getByText("3. Orders and Payments")).toBeInTheDocument();
    expect(screen.getByText("4. Cancellations and Refunds")).toBeInTheDocument();
    expect(screen.getByText("5. Delivery")).toBeInTheDocument();
    expect(screen.getByText("6. User Conduct")).toBeInTheDocument();
    expect(screen.getByText("7. Intellectual Property")).toBeInTheDocument();
    expect(screen.getByText("8. Limitation of Liability")).toBeInTheDocument();
    expect(screen.getByText("9. Governing Law")).toBeInTheDocument();
    expect(screen.getByText("10. Changes to Terms")).toBeInTheDocument();
    expect(screen.getByText("11. Contact")).toBeInTheDocument();
  });

  it("mentions AUD currency", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByText(/Australian Dollars/)).toBeInTheDocument();
  });

  it("mentions delivery fee", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByText(/\$2\.00/)).toBeInTheDocument();
  });

  it("includes legal contact email", () => {
    render(<TermsOfServicePage />);
    expect(screen.getByRole("link", { name: /legal@tomato\.com/ })).toHaveAttribute(
      "href",
      "mailto:legal@tomato.com",
    );
  });
});
