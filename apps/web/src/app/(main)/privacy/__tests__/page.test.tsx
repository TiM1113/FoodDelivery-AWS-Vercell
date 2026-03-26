import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import PrivacyPolicyPage from "../page";

describe("PrivacyPolicyPage", () => {
  it("renders the page title", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();
  });

  it("renders all section headings", () => {
    render(<PrivacyPolicyPage />);

    expect(screen.getByText("1. Information We Collect")).toBeInTheDocument();
    expect(screen.getByText("2. How We Use Your Information")).toBeInTheDocument();
    expect(screen.getByText("3. Payment Security")).toBeInTheDocument();
    expect(screen.getByText("4. Data Sharing")).toBeInTheDocument();
    expect(screen.getByText("5. Data Retention")).toBeInTheDocument();
    expect(screen.getByText("6. Your Rights")).toBeInTheDocument();
    expect(screen.getByText("7. Cookies")).toBeInTheDocument();
    expect(screen.getByText("8. Contact Us")).toBeInTheDocument();
  });

  it("mentions Stripe for payment processing", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/PCI DSS Level 1/)).toBeInTheDocument();
  });

  it("mentions Australian Privacy Act", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByText(/Australian Privacy Act/)).toBeInTheDocument();
  });

  it("includes privacy contact email", () => {
    render(<PrivacyPolicyPage />);
    expect(screen.getByRole("link", { name: /privacy@tomato\.com/ })).toHaveAttribute(
      "href",
      "mailto:privacy@tomato.com",
    );
  });
});
