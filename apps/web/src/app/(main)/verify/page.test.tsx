import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks — vi.hoisted ensures variables exist before vi.mock factory runs
// ---------------------------------------------------------------------------
const { mockPush, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

vi.mock("next/link", () => {
  function MockLink({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a href={href} {...props}>{children}</a>;
  }
  return { default: MockLink };
});

import VerifyPage from "./page";

beforeEach(() => {
  mockPush.mockReset();
  mockGet.mockReset();
});

describe("VerifyPage", () => {
  it("shows polling state when success is not false and orderId exists", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return "order_123";
      if (key === "success") return "true";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ payment: false }),
    );

    render(<VerifyPage />);

    expect(screen.getByText("Confirming your payment…")).toBeDefined();
  });

  it("shows cancelled state when success=false", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return "order_123";
      if (key === "success") return "false";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    render(<VerifyPage />);

    expect(screen.getByText("Payment Cancelled")).toBeDefined();
  });

  it("shows error state when orderId is missing", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return null;
      if (key === "success") return "true";
      return null;
    });

    render(<VerifyPage />);

    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("transitions to success when payment is confirmed", async () => {
    vi.useFakeTimers();

    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return "order_123";
      if (key === "success") return "true";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ payment: true }),
    );

    render(<VerifyPage />);

    // Advance past the first poll interval (2000ms) and flush microtasks
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });

    expect(screen.getByText("Payment Successful!")).toBeDefined();

    vi.useRealTimers();
  });

  it("does not send cancel request to backend when success=false (read-only verify)", () => {
    vi.restoreAllMocks();

    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return "order_abc";
      if (key === "success") return "false";
      return null;
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    render(<VerifyPage />);

    // verify is now read-only — no backend call on cancellation
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows 'Back to Cart' link on cancellation", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return "order_123";
      if (key === "success") return "false";
      return null;
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true }),
    );

    render(<VerifyPage />);

    const link = screen.getByText("Back to Cart");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/cart");
  });

  it("shows 'View My Orders' link on error", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "orderId") return null;
      if (key === "success") return "true";
      return null;
    });

    render(<VerifyPage />);

    const link = screen.getByText("View My Orders");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/myorders");
  });
});
