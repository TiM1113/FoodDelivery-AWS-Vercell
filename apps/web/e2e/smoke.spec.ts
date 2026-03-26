import { test, expect } from "@playwright/test";

test.describe("Smoke tests — pages load without errors", () => {
  test("homepage loads and shows hero section", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByText("Order your favourite food here"),
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "View Menu" })).toBeVisible();
  });

  test("homepage shows food listing section", async ({ page }) => {
    await page.goto("/");

    // Food section should render with category filter and food items
    await expect(page.getByPlaceholder("Search dishes...")).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Password" }),
    ).toBeVisible();
  });

  test("register page loads", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Create account" }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Password" }),
    ).toBeVisible();
  });

  test("navbar shows logo and navigation links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByAltText("Tomato")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Menu", exact: true }),
    ).toBeVisible();
  });

  test("theme toggle switches between light and dark mode", async ({
    page,
  }) => {
    await page.goto("/");

    const themeToggle = page.getByRole("button", { name: /theme/i });
    await expect(themeToggle).toBeVisible();

    const html = page.locator("html");
    const initialClass = await html.getAttribute("class");

    // Click to toggle theme
    await themeToggle.click();

    // Verify the class attribute changed after toggle
    await expect(html).not.toHaveAttribute("class", initialClass ?? "");
  });
});
