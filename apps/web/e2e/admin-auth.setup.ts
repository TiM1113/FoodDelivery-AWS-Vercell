import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { neon } from "@neondatabase/serverless";

// ---------------------------------------------------------------------------
// Admin test user credentials
// ---------------------------------------------------------------------------
const ADMIN_EMAIL = "e2e-test-admin@test.com";
const ADMIN_PASSWORD = "AdminTestPass123!";
const ADMIN_NAME = "E2E Admin";

export const ADMIN_STORAGE_STATE = path.join(
  __dirname,
  ".admin-auth-state.json",
);

// ---------------------------------------------------------------------------
// Read DATABASE_URL from backend/.env
// ---------------------------------------------------------------------------
function getDatabaseUrl(): string {
  const envPath = path.resolve(__dirname, "../../../backend/.env");
  const envContent = fs.readFileSync(envPath, "utf-8");
  const match = envContent.match(/^DATABASE_URL=(.+)$/m);
  if (!match) throw new Error("DATABASE_URL not found in backend/.env");
  return match[1].trim();
}

// ---------------------------------------------------------------------------
// Setup: ensure admin user exists, promote to admin, login with admin session
// ---------------------------------------------------------------------------
setup("authenticate admin", async ({ page }) => {
  setup.setTimeout(60_000);

  const sql = neon(getDatabaseUrl());

  // Step 1: Check if user already exists via SQL (avoids flaky login-first flow)
  const existing =
    await sql`SELECT id FROM users WHERE email = ${ADMIN_EMAIL}`;

  if (existing.length === 0) {
    // Step 2: Register the admin user via UI
    await page.goto("/register");
    await page.getByLabel("Name").fill(ADMIN_NAME);
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page
      .getByRole("textbox", { name: "Password" })
      .fill(ADMIN_PASSWORD);
    await page
      .getByRole("button", { name: /sign up|create|register/i })
      .click();

    // Wait for registration to redirect away from /register
    await page.waitForURL((url) => !url.pathname.startsWith("/register"), {
      timeout: 20_000,
    });
  }

  // Step 3: Promote to admin via direct SQL (idempotent)
  await sql`UPDATE users SET role = 'admin' WHERE email = ${ADMIN_EMAIL}`;

  // Step 4: Log in fresh to get admin role baked into JWT session
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByRole("textbox", { name: "Password" }).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Admin users auto-redirect to /admin (login-form.tsx lines 39-44)
  await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 });

  // Verify admin layout loaded (not "Access Denied")
  await expect(page.getByText("Admin").first()).toBeVisible({ timeout: 5_000 });

  // Step 5: Save storage state for admin tests
  await page.context().storageState({ path: ADMIN_STORAGE_STATE });
});
