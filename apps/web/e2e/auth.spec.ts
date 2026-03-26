import { test, expect } from "@playwright/test";

test.describe("Authentication flows", () => {
  test("login page shows validation on empty submit", async ({ page }) => {
    await page.goto("/login");

    // HTML5 required validation prevents empty submit
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should still be on login page (form not submitted)
    await expect(
      page.getByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
  });

  test("login page has link to register", async ({ page }) => {
    await page.goto("/login");

    const signUpLink = page.getByRole("link", { name: "Sign up" });
    await expect(signUpLink).toBeVisible();

    await signUpLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test("register page has link to login", async ({ page }) => {
    await page.goto("/register");

    const signInLink = page.getByRole("link", {
      name: "Sign in",
      exact: true,
    });
    await expect(signInLink).toBeVisible();

    await signInLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("password visibility toggle works on login page", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByRole("textbox", { name: "Password" });
    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("password visibility toggle works on register page", async ({
    page,
  }) => {
    await page.goto("/register");

    const passwordInput = page.getByRole("textbox", { name: "Password" });
    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
  });

  // Requires running backend API — will timeout in CI without it (expected)
  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("fake@example.com");
    await page.getByRole("textbox", { name: "Password" }).fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Wait for the API response and error message
    await expect(
      page.getByText(/invalid|error|failed/i),
    ).toBeVisible({
      timeout: 15_000,
    });
  });

  test("unauthenticated user sees Sign In button", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("link", { name: "Sign In" }),
    ).toBeVisible();
  });
});
