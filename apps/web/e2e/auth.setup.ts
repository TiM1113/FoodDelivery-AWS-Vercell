import { test as setup, expect } from "@playwright/test";
import path from "path";

const TEST_EMAIL = "e2e-test-address@test.com";
const TEST_PASSWORD = "TestPass123!";

export const STORAGE_STATE = path.join(__dirname, ".auth-state.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await expect(
    page.getByRole("button", { name: /menu/i }),
  ).toBeVisible({ timeout: 5_000 });

  await page.context().storageState({ path: STORAGE_STATE });
});
