import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { KycVerification } from "../kyc-verification";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("KycVerification", () => {
  it("shows loading state initially", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {}),
    );

    render(<KycVerification />, { wrapper: createWrapper() });
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders unverified status with start button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { status: "unverified", sessionId: null },
      }),
    );

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Not Verified")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /start verification/i })).toBeInTheDocument();
  });

  it("renders verified status without start button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { status: "verified", sessionId: "vs_123" },
      }),
    );

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Verified")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /start verification/i })).not.toBeInTheDocument();
  });

  it("renders pending status with polling indicator", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { status: "pending", sessionId: "vs_456" },
      }),
    );

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Verification Pending")).toBeInTheDocument();
    });
    expect(screen.getByText("Checking verification status…")).toBeInTheDocument();
  });

  it("renders requires_input status with start button", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { status: "requires_input", sessionId: "vs_789" },
      }),
    );

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Action Required")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /start verification/i })).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("renders info section about KYC", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        success: true,
        data: { status: "unverified", sessionId: null },
      }),
    );

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("What is KYC Verification?")).toBeInTheDocument();
    });
    expect(screen.getByText(/government-issued ID/)).toBeInTheDocument();
  });

  it("calls POST to create verification session on button click", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // First call: GET status
    fetchSpy.mockResolvedValueOnce(
      Response.json({
        success: true,
        data: { status: "unverified", sessionId: null },
      }),
    );

    // Second call: POST create session
    fetchSpy.mockResolvedValueOnce(
      Response.json({
        success: true,
        data: { sessionId: "vs_new", url: "https://verify.stripe.com/test" },
      }),
    );

    // Third call: refetch after invalidation
    fetchSpy.mockResolvedValueOnce(
      Response.json({
        success: true,
        data: { status: "pending", sessionId: "vs_new" },
      }),
    );

    // Mock window.open
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /start verification/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /start verification/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith("/api/admin/kyc", expect.objectContaining({
        method: "POST",
      }));
    });

    expect(openSpy).toHaveBeenCalledWith(
      "https://verify.stripe.com/test",
      "_blank",
      "noopener,noreferrer",
    );

    openSpy.mockRestore();
  });
});
