import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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
const mockGetSession = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  getSession: () => mockGetSession(),
}));

import { LoginForm } from "../login-form";

function fillAndSubmit(email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: password },
  });
  const form = screen.getByRole("button", { name: /sign in/i }).closest("form");
  if (!form) throw new Error("Could not find form element");
  fireEvent.submit(form);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPush.mockReset();
  mockRefresh.mockReset();
  mockSignIn.mockReset();
  mockGetSession.mockReset();
});

describe("LoginForm", () => {
  it("renders email, password fields and submit button", () => {
    render(<LoginForm />);

    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows error on invalid credentials", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });

    render(<LoginForm />);
    fillAndSubmit("bad@test.com", "wrong");

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("redirects to / on successful login for regular user", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ user: { role: "user" } });

    render(<LoginForm />);
    fillAndSubmit("user@test.com", "password123");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("redirects admin to /admin when no explicit callbackUrl", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    mockGetSession.mockResolvedValue({ user: { role: "admin" } });

    render(<LoginForm />);
    fillAndSubmit("admin@test.com", "password123");

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin");
    });
  });

  it("shows generic error on network failure", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));

    render(<LoginForm />);
    fillAndSubmit("user@test.com", "password123");

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    });
  });

  it("has a link to the register page", () => {
    render(<LoginForm />);

    const link = screen.getByText("Sign up");
    expect(link.getAttribute("href")).toBe("/register?callbackUrl=%2F");
  });

  it("toggles password visibility", () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText("Password");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(passwordInput).toHaveAttribute("type", "text");

    fireEvent.click(screen.getByRole("button", { name: "Hide password" }));
    expect(passwordInput).toHaveAttribute("type", "password");
  });
});
