import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function gotoKycPage(page: Page) {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/admin/kyc");
  await sessionReady;

  // Wait for KYC page to load (heading appears after spinner)
  await expect(
    page.getByRole("heading", { name: "Identity Verification" }),
  ).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "admin" project via storageState
// ---------------------------------------------------------------------------

test.describe("Admin KYC verification", () => {
  test("KYC page shows heading and description", async ({ page }) => {
    await gotoKycPage(page);

    await expect(
      page.getByRole("heading", { name: "Identity Verification" }),
    ).toBeVisible();
    await expect(
      page.getByText("Verify your identity to comply with KYC regulations"),
    ).toBeVisible();
  });

  test("KYC page shows verification status card", async ({ page }) => {
    await gotoKycPage(page);

    await expect(page.getByText("Verification Status")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("KYC page shows a status badge", async ({ page }) => {
    await gotoKycPage(page);

    await expect(page.getByText("Verification Status")).toBeVisible({
      timeout: 10_000,
    });

    // One of the status badges should be visible
    const badges = ["Not Verified", "Verification Pending", "Verified", "Action Required"];
    let found = false;
    for (const badge of badges) {
      if (await page.getByText(badge, { exact: true }).isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found).toBeTruthy();
  });

  test("KYC page shows informational section", async ({ page }) => {
    await gotoKycPage(page);

    await expect(page.getByText("What is KYC Verification?")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText("Identity verification using a government-issued ID document"),
    ).toBeVisible();
    await expect(
      page.getByText("Processed securely through Stripe Identity"),
    ).toBeVisible();
  });

  test("KYC page shows Stripe Identity link", async ({ page }) => {
    await gotoKycPage(page);

    const stripeLink = page.getByRole("link", {
      name: /Learn more about Stripe Identity/,
    });
    await expect(stripeLink).toBeVisible({ timeout: 10_000 });
    await expect(stripeLink).toHaveAttribute("href", "https://stripe.com/identity");
  });

  test("KYC page shows status change history section", async ({ page }) => {
    await gotoKycPage(page);

    await expect(page.getByText("Status Change History")).toBeVisible({
      timeout: 10_000,
    });
  });
});
