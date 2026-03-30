import { test, expect } from "@playwright/test";
import path from "path";

const regularUserState = path.join(__dirname, ".auth-state.json");

// ---------------------------------------------------------------------------
// Tests — admin access control
// ---------------------------------------------------------------------------

test.describe("Admin access control", () => {
  test("unauthenticated user visiting /admin is redirected to login", async ({
    browser,
  }) => {
    // Create a fresh context with NO auth state (override project-level storageState)
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

    await context.close();
  });

  test("regular user sees Access Denied on /admin", async ({ browser }) => {
    // Use regular user storageState
    const context = await browser.newContext({
      storageState: regularUserState,
    });
    const page = await context.newPage();

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Access Denied" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText("You do not have permission to access the admin panel"),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Go back to homepage" }),
    ).toBeVisible();

    await context.close();
  });

  test("Access Denied page links back to homepage", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: regularUserState,
    });
    const page = await context.newPage();

    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Access Denied" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Go back to homepage" }).click();
    await expect(page).toHaveURL(/^\/$|^http:\/\/localhost:\d+\/$/, {
      timeout: 5_000,
    });

    await context.close();
  });
});
