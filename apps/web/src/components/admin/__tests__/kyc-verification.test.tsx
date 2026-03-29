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

/** Mock fetch to return different responses based on URL path. */
function mockFetchResponses(
  statusData: { status: string; sessionId: string | null },
  auditLogs: unknown[] = [],
) {
  return vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = typeof input === "string" ? input : (input as Request).url;

    if (url.includes("/audit-logs")) {
      return Promise.resolve(
        Response.json({ success: true, data: auditLogs }),
      );
    }
    // Default: status endpoint
    return Promise.resolve(
      Response.json({ success: true, data: statusData }),
    );
  });
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
    mockFetchResponses({ status: "unverified", sessionId: null });

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Not Verified")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /start verification/i })).toBeInTheDocument();
  });

  it("renders verified status without start button", async () => {
    mockFetchResponses({ status: "verified", sessionId: "vs_123" });

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Verified")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /start verification/i })).not.toBeInTheDocument();
  });

  it("renders pending status with polling indicator", async () => {
    mockFetchResponses({ status: "pending", sessionId: "vs_456" });

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Verification Pending")).toBeInTheDocument();
    });
    expect(screen.getByText("Checking verification status…")).toBeInTheDocument();
  });

  it("renders requires_input status with start button", async () => {
    mockFetchResponses({ status: "requires_input", sessionId: "vs_789" });

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
    mockFetchResponses({ status: "unverified", sessionId: null });

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("What is KYC Verification?")).toBeInTheDocument();
    });
    expect(screen.getByText(/government-issued ID/)).toBeInTheDocument();
  });

  it("renders audit log history section", async () => {
    mockFetchResponses({ status: "verified", sessionId: "vs_123" }, [
      {
        id: "log-1",
        previousStatus: "pending",
        newStatus: "verified",
        trigger: "webhook",
        stripeSessionId: "vs_123",
        createdAt: "2026-03-29T12:00:00Z",
      },
      {
        id: "log-2",
        previousStatus: "unverified",
        newStatus: "pending",
        trigger: "admin_action",
        stripeSessionId: "vs_123",
        createdAt: "2026-03-29T11:50:00Z",
      },
    ]);

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("Status Change History")).toBeInTheDocument();
    });
    expect(screen.getByText("via Stripe")).toBeInTheDocument();
    expect(screen.getByText("via Admin")).toBeInTheDocument();
  });

  it("shows empty state when no audit logs exist", async () => {
    mockFetchResponses({ status: "unverified", sessionId: null }, []);

    render(<KycVerification />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No status changes recorded yet.")).toBeInTheDocument();
    });
  });

  it("calls POST to create verification session on button click", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    // Route-based mock: return different data per URL, then override for POST
    let postCalled = false;
    fetchSpy.mockImplementation((input, init) => {
      const url = typeof input === "string" ? input : (input as Request).url;
      const method = init?.method ?? "GET";

      if (method === "POST") {
        postCalled = true;
        return Promise.resolve(
          Response.json({
            success: true,
            data: { sessionId: "vs_new", url: "https://verify.stripe.com/test" },
          }),
        );
      }

      if (url.includes("/audit-logs")) {
        return Promise.resolve(
          Response.json({ success: true, data: [] }),
        );
      }

      // Status endpoint — return pending after POST was called
      return Promise.resolve(
        Response.json({
          success: true,
          data: {
            status: postCalled ? "pending" : "unverified",
            sessionId: postCalled ? "vs_new" : null,
          },
        }),
      );
    });

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
      expect(openSpy).toHaveBeenCalledWith(
        "https://verify.stripe.com/test",
        "_blank",
        "noopener,noreferrer",
      );
    });

    openSpy.mockRestore();
  });
});
