import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "setup" project via storageState
// ---------------------------------------------------------------------------

test.describe("Order management", () => {
  test.describe.configure({ mode: "serial" });

  test("my orders page shows heading and tab buttons", async ({ page }) => {
    await page.goto("/myorders");

    await expect(
      page.getByRole("heading", { name: "My Orders" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByRole("button", { name: "Recent Orders" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Favourites" }),
    ).toBeVisible();
  });

  test("my orders shows empty state when no orders exist", async ({
    page,
  }) => {
    await page.goto("/myorders");
    await expect(
      page.getByRole("heading", { name: "My Orders" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText("No orders found")).toBeVisible({
      timeout: 5_000,
    });
  });

  test("favourites tab can be toggled", async ({ page }) => {
    await page.goto("/myorders");
    await expect(
      page.getByRole("heading", { name: "My Orders" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Favourites" }).click();

    await page.getByRole("button", { name: "Recent Orders" }).click();
    await expect(
      page.getByRole("button", { name: "Recent Orders" }),
    ).toBeVisible();
  });

  test("my orders link in navbar navigates correctly", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "My Orders" }).click();
    await expect(page).toHaveURL(/\/myorders/, { timeout: 5_000 });
    await expect(
      page.getByRole("heading", { name: "My Orders" }),
    ).toBeVisible();
  });
});
