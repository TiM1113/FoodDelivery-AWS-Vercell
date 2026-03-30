import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoAdminWithSession(page: Page) {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/admin");
  await sessionReady;
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "admin" project via storageState
// ---------------------------------------------------------------------------

test.describe("Admin dashboard", () => {
  test("dashboard shows four stat cards", async ({ page }) => {
    await gotoAdminWithSession(page);

    // Wait for stats to load (spinner disappears, stat cards appear)
    await expect(page.getByText("Total Revenue")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Total Orders")).toBeVisible();
    await expect(page.getByText("Total Users")).toBeVisible();
    await expect(page.getByText("Menu Items")).toBeVisible();
  });

  test("total revenue shows dollar format", async ({ page }) => {
    await gotoAdminWithSession(page);

    await expect(page.getByText("Total Revenue")).toBeVisible({
      timeout: 15_000,
    });

    // At least one element on the page should show a dollar amount (the revenue value)
    await expect(page.getByText(/^\$\d/).first()).toBeVisible();
  });

  test("dashboard displays charts after data loads", async ({ page }) => {
    await gotoAdminWithSession(page);

    // Wait for stats to load
    await expect(page.getByText("Total Revenue")).toBeVisible({
      timeout: 15_000,
    });

    // Recharts renders SVG elements — verify at least one chart container
    // has rendered by checking for SVG elements
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 10_000 });
  });

  test("dashboard fetches stats from admin API", async ({ page }) => {
    // Intercept the stats API call to verify it fires
    const statsResponse = page.waitForResponse(
      (r) =>
        r.url().includes("/api/admin/stats") && r.request().method() === "GET",
    );

    await gotoAdminWithSession(page);
    const response = await statsResponse;

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});
