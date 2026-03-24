import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => {
  function MockLink({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return { default: MockLink };
});

const mockSignIn = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

import { RegisterForm } from "../register-form";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fillForm(name: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
}

function submitForm() {
  const form = screen.getByRole("button", { name: /create account/i }).closest("form")!;
  fireEvent.submit(form);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.restoreAllMocks();
  mockPush.mockReset();
  mockRefresh.mockReset();
  mockSignIn.mockReset();
});

describe("RegisterForm", () => {
  it("renders all fields and links", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("heading", { name: /create account/i })).toBeDefined();
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: /create account/i })).toBeDefined();
    expect(screen.getByText("Sign in")).toBeDefined();
  });

  it("shows Zod validation error for short password", async () => {
    render(<RegisterForm />);

    fillForm("Tim", "tim@test.com", "12345");
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 6 characters"),
      ).toBeDefined();
    });

    // Should NOT call fetch (Zod blocked submission)
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows Zod validation error for invalid email", async () => {
    render(<RegisterForm />);

    fillForm("Tim", "not-an-email", "password123");
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Invalid email address")).toBeDefined();
    });
  });

  it("shows Zod validation error for empty name", async () => {
    render(<RegisterForm />);

    fillForm("", "tim@test.com", "password123");
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("Name is required")).toBeDefined();
    });
  });

  it("registers and auto-logs in on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, role: "user" }),
    );
    mockSignIn.mockResolvedValue({ error: null });

    render(<RegisterForm />);

    fillForm("Tim", "tim@test.com", "password123");
    submitForm();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "tim@test.com",
        password: "password123",
        redirect: false,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error when backend says email already exists", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: false, message: "User already exists" }),
    );

    render(<RegisterForm />);

    fillForm("Tim", "existing@test.com", "password123");
    submitForm();

    await waitFor(() => {
      expect(screen.getByText("User already exists")).toBeDefined();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows error when auto-login fails after registration", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ success: true, role: "user" }),
    );
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

    render(<RegisterForm />);

    fillForm("Tim", "tim@test.com", "password123");
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText("Account created but auto-login failed. Please sign in."),
      ).toBeDefined();
    });
  });

  it("shows generic error on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<RegisterForm />);

    fillForm("Tim", "tim@test.com", "password123");
    submitForm();

    await waitFor(() => {
      expect(
        screen.getByText("Something went wrong. Please try again."),
      ).toBeDefined();
    });
  });

  it("has a link to login page", () => {
    render(<RegisterForm />);

    const link = screen.getByText("Sign in");
    expect(link.getAttribute("href")).toBe("/login?callbackUrl=%2F");
  });
});
