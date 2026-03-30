import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoAdminOrders(page: Page) {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/admin/orders");
  await sessionReady;

  // Wait for orders page to load (heading appears after skeleton)
  await expect(page.getByRole("heading", { name: "Orders" })).toBeVisible({
    timeout: 15_000,
  });
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "admin" project via storageState
// ---------------------------------------------------------------------------

test.describe("Admin orders", () => {
  test("orders page shows heading", async ({ page }) => {
    await gotoAdminOrders(page);

    await expect(
      page.getByRole("heading", { name: "Orders" }),
    ).toBeVisible();
  });

  test("orders page shows payment and status filter dropdowns", async ({
    page,
  }) => {
    await gotoAdminOrders(page);

    await expect(
      page.locator("[aria-label='Payment filter']"),
    ).toBeVisible();
    await expect(
      page.locator("[aria-label='Status filter']"),
    ).toBeVisible();
  });

  test("payment filter has correct options", async ({ page }) => {
    await gotoAdminOrders(page);

    await page.locator("[aria-label='Payment filter']").click();

    await expect(
      page.getByRole("option", { name: "All payments" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Paid", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Unpaid", exact: true }),
    ).toBeVisible();

    // Close dropdown
    await page.keyboard.press("Escape");
  });

  test("status filter has correct options", async ({ page }) => {
    await gotoAdminOrders(page);

    await page.locator("[aria-label='Status filter']").click();

    await expect(
      page.getByRole("option", { name: "All statuses" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Payment Pending" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Food Processing" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Out for Delivery" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Delivered" }),
    ).toBeVisible();
    await expect(
      page.getByRole("option", { name: "Cancelled" }),
    ).toBeVisible();

    await page.keyboard.press("Escape");
  });

  test("orders page shows table or empty state", async ({ page }) => {
    await gotoAdminOrders(page);

    // Either the table is visible with orders, or empty state is shown
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText("No orders found.")
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  test("orders table shows correct column headers when orders exist", async ({
    page,
  }) => {
    await gotoAdminOrders(page);

    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);

    if (hasTable) {
      await expect(
        page.getByRole("columnheader", { name: "Items" }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Customer" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Amount/i }).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Payment" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Status/i }).first(),
      ).toBeVisible();
    }
  });
});
