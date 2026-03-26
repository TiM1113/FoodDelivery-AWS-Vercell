import { test, expect } from "@playwright/test";

test.describe("Navigation and menu interactions", () => {
  test("View Menu button scrolls to menu section", async ({ page }) => {
    await page.goto("/");

    const viewMenuBtn = page.getByRole("link", { name: "View Menu" });
    await expect(viewMenuBtn).toBeVisible();

    await viewMenuBtn.click();

    // The #menu section should be scrolled into view
    const menuSection = page.locator("#menu");
    await expect(menuSection).toBeVisible();
    await expect(menuSection).toBeInViewport();
  });

  test("menu section shows category filters", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Explore our menu")).toBeVisible();

    // At least the "All" category should be visible
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
  });

  test("search box is functional", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder("Search dishes...");
    await expect(searchInput).toBeVisible();

    // Type into search box — should accept input
    await searchInput.fill("pasta");
    await expect(searchInput).toHaveValue("pasta");
  });

  test("cart icon is visible with correct href", async ({ page }) => {
    await page.goto("/");

    const cartLink = page.getByRole("link", { name: /cart/i });
    await expect(cartLink).toBeVisible();
    await expect(cartLink).toHaveAttribute("href", "/cart");
  });

  test("footer shows company info and contact", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    await expect(
      footer.getByRole("heading", { name: "Tomato" }),
    ).toBeVisible();
    await expect(footer.getByText("contact@tomato.com")).toBeVisible();
  });

  test("clicking logo navigates to homepage", async ({ page }) => {
    await page.goto("/login");

    // Click the logo to go back to homepage
    const logo = page.getByAltText("Tomato");
    await expect(logo).toBeVisible();

    await logo.click();
    await expect(page).toHaveURL("/");
  });
});
