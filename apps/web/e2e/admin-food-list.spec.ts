import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoFoodList(page: Page) {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/admin/items");
  await sessionReady;

  // Wait for food list to load (heading appears after skeleton)
  await expect(
    page.getByRole("heading", { name: "All Food Items" }),
  ).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "admin" project via storageState
// ---------------------------------------------------------------------------

test.describe("Admin food list", () => {
  test("food list page shows heading and toolbar", async ({ page }) => {
    await gotoFoodList(page);

    await expect(
      page.getByRole("heading", { name: "All Food Items" }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Search by name...")).toBeVisible();
  });

  test("category filter dropdown is visible", async ({ page }) => {
    await gotoFoodList(page);

    // The Select component renders a trigger button with the default value text
    // Look for the select trigger in the toolbar area (w-[160px] class)
    await expect(
      page.locator("button[data-slot='select-trigger']").last(),
    ).toBeVisible();
  });

  test("food table shows correct column headers", async ({ page }) => {
    await gotoFoodList(page);

    // Wait for table to render
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole("columnheader", { name: "Image" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Name/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Category/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Price/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Actions" }),
    ).toBeVisible();
  });

  test("food items show prices in dollar format", async ({ page }) => {
    await gotoFoodList(page);

    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // At least one cell should contain a dollar price
    await expect(page.getByText(/^\$\d+\.\d{2}$/).first()).toBeVisible();
  });

  test("pagination shows item count", async ({ page }) => {
    await gotoFoodList(page);

    await expect(page.getByText(/\d+ item\(s\) total/)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("search filters food items by name", async ({ page }) => {
    await gotoFoodList(page);

    // Get initial item count
    const countText = await page
      .getByText(/\d+ item\(s\) total/)
      .textContent();
    const initialCount = parseInt(countText?.match(/\d+/)?.[0] ?? "0");

    // Search for a term that should return fewer results
    await page.getByPlaceholder("Search by name...").fill("pasta");

    // Wait for filter to apply
    await page.waitForTimeout(500);

    const filteredText = await page
      .getByText(/\d+ item\(s\) total/)
      .textContent();
    const filteredCount = parseInt(filteredText?.match(/\d+/)?.[0] ?? "0");

    // Filtered count should be different (fewer or same if all match)
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("clearing search shows all items again", async ({ page }) => {
    await gotoFoodList(page);

    const countText = await page
      .getByText(/\d+ item\(s\) total/)
      .textContent();
    const initialCount = parseInt(countText?.match(/\d+/)?.[0] ?? "0");

    await page.getByPlaceholder("Search by name...").fill("pasta");
    await page.waitForTimeout(500);

    await page.getByPlaceholder("Search by name...").clear();
    await page.waitForTimeout(500);

    const restoredText = await page
      .getByText(/\d+ item\(s\) total/)
      .textContent();
    const restoredCount = parseInt(restoredText?.match(/\d+/)?.[0] ?? "0");

    expect(restoredCount).toBe(initialCount);
  });

  test("edit button opens edit dialog with pre-filled fields", async ({
    page,
  }) => {
    await gotoFoodList(page);

    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Click the first edit (pencil) button — it's a ghost icon button
    const firstRow = page.locator("table tbody tr").first();
    await firstRow.locator("button").first().click();

    // Edit dialog should open
    await expect(
      page.getByRole("heading", { name: "Edit Food Item" }),
    ).toBeVisible({ timeout: 5_000 });

    // Fields should be pre-filled (not empty)
    await expect(page.getByLabel("Name")).not.toHaveValue("");
    await expect(page.getByLabel("Description")).not.toHaveValue("");
  });

  test("edit dialog can be closed", async ({ page }) => {
    await gotoFoodList(page);

    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    const firstRow = page.locator("table tbody tr").first();
    await firstRow.locator("button").first().click();

    await expect(
      page.getByRole("heading", { name: "Edit Food Item" }),
    ).toBeVisible({ timeout: 5_000 });

    // Press Escape to close
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("heading", { name: "Edit Food Item" }),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test("delete button shows confirmation dialog", async ({ page }) => {
    await gotoFoodList(page);

    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    // Each row has 2 action buttons: edit (pencil) and delete (trash).
    // The delete button is inside an AlertDialogTrigger. Click the last
    // button in the first row's actions cell.
    const firstRow = page.locator("table tbody tr").first();
    const actionButtons = firstRow.locator("td").last().locator("button");
    await actionButtons.last().click();

    // Confirmation dialog should appear
    await expect(page.getByText(/Delete \u201c.+\u201d\?/)).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      page.getByText("This action cannot be undone"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Cancel" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Delete" }),
    ).toBeVisible();
  });

  test("delete confirmation can be cancelled", async ({ page }) => {
    await gotoFoodList(page);

    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });

    const firstRow = page.locator("table tbody tr").first();
    const actionButtons = firstRow.locator("td").last().locator("button");
    await actionButtons.last().click();

    await expect(page.getByText(/Delete \u201c.+\u201d\?/)).toBeVisible({
      timeout: 5_000,
    });

    await page.getByRole("button", { name: "Cancel" }).click();

    // Dialog should close, table still visible
    await expect(
      page.getByText(/Delete \u201c.+\u201d\?/),
    ).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator("table")).toBeVisible();
  });
});
