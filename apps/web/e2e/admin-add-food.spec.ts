import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoAddFood(page: Page) {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/admin/add");
  await sessionReady;

  await expect(
    page.getByRole("heading", { name: "Add Food Item" }),
  ).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "admin" project via storageState
// ---------------------------------------------------------------------------

test.describe("Admin add food", () => {
  test("add food page shows form with all fields", async ({ page }) => {
    await gotoAddFood(page);

    await expect(
      page.getByText("Upload Image", { exact: true }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Enter product name")).toBeVisible();
    await expect(
      page.getByPlaceholder("Write product description"),
    ).toBeVisible();
    await expect(page.getByText("Category")).toBeVisible();
    await expect(page.getByPlaceholder("25")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Food Item" }),
    ).toBeVisible();
  });

  test("image upload area shows instructions", async ({ page }) => {
    await gotoAddFood(page);

    await expect(page.getByText("Click to upload image")).toBeVisible();
    await expect(
      page.getByText("JPEG, PNG, WebP, GIF (max 5MB)"),
    ).toBeVisible();
  });

  test("category dropdown has all food categories", async ({ page }) => {
    await gotoAddFood(page);

    // Click the category select trigger to open dropdown
    await page.locator("button").filter({ hasText: "Salad" }).click();

    // Verify all categories are present
    for (const cat of [
      "Salad",
      "Rolls",
      "Deserts",
      "Sandwich",
      "Cake",
      "Pure Veg",
      "Pasta",
      "Noodles",
    ]) {
      await expect(
        page.getByRole("option", { name: cat, exact: true }),
      ).toBeVisible();
    }
  });

  test("submitting empty form shows validation errors", async ({ page }) => {
    await gotoAddFood(page);

    // Clear the product name (if any default) and submit
    await page.getByPlaceholder("Enter product name").clear();
    await page.getByRole("button", { name: "Add Food Item" }).click();

    // Zod validation errors should appear
    await expect(
      page.locator("text=/required|at least|must/i").first(),
    ).toBeVisible({ timeout: 3_000 });
  });

  test("submitting without image shows image error", async ({ page }) => {
    await gotoAddFood(page);

    // Fill in all fields except image
    await page.getByPlaceholder("Enter product name").fill("Test Food Item");
    await page
      .getByPlaceholder("Write product description")
      .fill("A test description");
    await page.getByPlaceholder("25").fill("9.99");

    await page.getByRole("button", { name: "Add Food Item" }).click();

    await expect(page.getByText("Please select an image")).toBeVisible({
      timeout: 3_000,
    });
  });
});
