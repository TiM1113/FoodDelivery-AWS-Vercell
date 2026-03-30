import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Menu features — no authentication required
// ---------------------------------------------------------------------------

test.describe("Menu features", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for food cards to render
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("category filter buttons are visible", async ({ page }) => {
    const categories = [
      "All",
      "Salad",
      "Rolls",
      "Deserts",
      "Sandwich",
      "Cake",
      "Pure Veg",
      "Pasta",
      "Noodles",
    ];

    for (const cat of categories) {
      await expect(
        page.getByRole("button", { name: cat }).first(),
      ).toBeVisible();
    }
  });

  test("clicking a category filter changes displayed dishes heading", async ({
    page,
  }) => {
    // Verify "All dishes" heading is present initially
    await expect(
      page.getByRole("heading", { name: "All dishes" }),
    ).toBeVisible();

    // Click "Pasta" filter
    await page.getByRole("button", { name: "Pasta" }).first().click();

    // Section heading (h2) should change to show filtered category
    await expect(
      page.getByRole("heading", { level: 2, name: "Pasta" }),
    ).toBeVisible({ timeout: 5_000 });

    // "All dishes" heading should no longer be visible
    await expect(
      page.getByRole("heading", { name: "All dishes" }),
    ).not.toBeVisible();
  });

  test("clicking All filter shows all dishes again", async ({ page }) => {
    // First filter by category
    await page.getByRole("button", { name: "Pasta" }).first().click();
    await expect(
      page.getByRole("heading", { level: 2, name: "Pasta" }),
    ).toBeVisible({ timeout: 5_000 });

    // Then click All
    await page.getByRole("button", { name: "All" }).first().click();
    await expect(
      page.getByRole("heading", { name: "All dishes" }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("search box filters dishes by name", async ({ page }) => {
    const searchBox = page.getByPlaceholder("Search dishes");
    await expect(searchBox).toBeVisible();

    // Type a search term — search is server-side with 300ms debounce
    await searchBox.fill("Noodles");

    // Wait for the heading to update, confirming server responded
    await expect(
      page.getByRole("heading", { level: 2, name: /Results for "Noodles"/i }),
    ).toBeVisible({ timeout: 10_000 });

    // Should have matching results (search matches name, description, and category)
    const headings = page.getByRole("heading", { level: 3 });
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search with no results shows empty state", async ({ page }) => {
    const searchBox = page.getByPlaceholder("Search dishes");
    await searchBox.fill("xyznonexistentdish12345");

    // Wait for server response — "No dishes found" replaces placeholder data
    await expect(page.getByText("No dishes found")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("sort dropdown changes dish order", async ({ page }) => {
    const sortDropdown = page.getByRole("combobox", { name: "Sort dishes" });
    await expect(sortDropdown).toBeVisible();

    // Sort by "Name: A–Z"
    await sortDropdown.selectOption("Name: A–Z");
    await page.waitForTimeout(500);

    // Verify items are in alphabetical order
    const headings = page.getByRole("heading", { level: 3 });
    const count = await headings.count();
    if (count >= 2) {
      const firstName = await headings.nth(0).textContent();
      const secondName = await headings.nth(1).textContent();
      expect(
        (firstName ?? "").localeCompare(secondName ?? ""),
      ).toBeLessThanOrEqual(0);
    }
  });

  test("sort by price low to high works", async ({ page }) => {
    const sortDropdown = page.getByRole("combobox", { name: "Sort dishes" });
    await sortDropdown.selectOption("Price: Low to High");
    await page.waitForTimeout(500);

    // Get prices from food card paragraphs
    const priceEls = page.locator("p").filter({ hasText: /^\$\d/ });
    const count = await priceEls.count();
    if (count >= 2) {
      const price1 = parseFloat(
        (await priceEls.nth(0).textContent())?.replace("$", "") ?? "0",
      );
      const price2 = parseFloat(
        (await priceEls.nth(1).textContent())?.replace("$", "") ?? "0",
      );
      expect(price1).toBeLessThanOrEqual(price2);
    }
  });

  test("food cards display name and price", async ({ page }) => {
    // First food card should have a heading and a price
    const firstHeading = page.getByRole("heading", { level: 3 }).first();
    await expect(firstHeading).toBeVisible();

    const headingText = await firstHeading.textContent();
    expect(headingText).toBeTruthy();

    // There should be a price visible on the page
    await expect(
      page.locator("p").filter({ hasText: /^\$\d/ }).first(),
    ).toBeVisible();
  });

  test("clearing search shows all dishes again", async ({ page }) => {
    const searchBox = page.getByPlaceholder("Search dishes");

    const initialCount = await page.getByRole("heading", { level: 3 }).count();

    await searchBox.fill("Pasta");
    await page.waitForTimeout(500);

    await searchBox.clear();
    await page.waitForTimeout(500);

    const restoredCount = await page
      .getByRole("heading", { level: 3 })
      .count();
    expect(restoredCount).toBe(initialCount);
  });
});
