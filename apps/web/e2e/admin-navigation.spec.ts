import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoAdminWithSession(page: Page, path = "/admin") {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto(path);
  await sessionReady;
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "admin" project via storageState
// ---------------------------------------------------------------------------

test.describe("Admin navigation", () => {
  test("sidebar shows all navigation links", async ({ page }) => {
    await gotoAdminWithSession(page);

    const sidebar = page.locator("aside");
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      sidebar.getByRole("link", { name: "List Items" }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Add Item" }),
    ).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Orders" })).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: "Verification" }),
    ).toBeVisible();
  });

  test("clicking List Items navigates to /admin/items", async ({ page }) => {
    await gotoAdminWithSession(page);

    await page.locator("aside").getByRole("link", { name: "List Items" }).click();
    await expect(page).toHaveURL(/\/admin\/items/, { timeout: 5_000 });
  });

  test("clicking Add Item navigates to /admin/add", async ({ page }) => {
    await gotoAdminWithSession(page);

    await page.locator("aside").getByRole("link", { name: "Add Item" }).click();
    await expect(page).toHaveURL(/\/admin\/add/, { timeout: 5_000 });
  });

  test("clicking Orders navigates to /admin/orders", async ({ page }) => {
    await gotoAdminWithSession(page);

    await page.locator("aside").getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/admin\/orders/, { timeout: 5_000 });
  });

  test("clicking Verification navigates to /admin/kyc", async ({ page }) => {
    await gotoAdminWithSession(page);

    await page
      .locator("aside")
      .getByRole("link", { name: "Verification" })
      .click();
    await expect(page).toHaveURL(/\/admin\/kyc/, { timeout: 5_000 });
  });

  test("admin header shows Admin badge", async ({ page }) => {
    await gotoAdminWithSession(page);

    const header = page.locator("header");
    await expect(
      header.getByText("Admin", { exact: true }),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("admin header shows user name", async ({ page }) => {
    await gotoAdminWithSession(page);

    const header = page.locator("header");
    await expect(header.getByText("E2E Admin")).toBeVisible({ timeout: 5_000 });
  });

  test("admin header logo links to homepage", async ({ page }) => {
    await gotoAdminWithSession(page);

    await page.locator("header").getByAltText("Tomato").click();
    await expect(page).toHaveURL(/^\/$|^http:\/\/localhost:\d+\/$/, {
      timeout: 5_000,
    });
  });
});
