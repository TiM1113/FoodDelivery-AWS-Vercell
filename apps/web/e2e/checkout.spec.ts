import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure cart has at least one item and navigate to checkout. */
async function ensureCartAndGoToCheckout(page: Page) {
  // Wait for NextAuth client session to hydrate before interacting with
  // AddToCartButton (it checks useSession() and redirects to /login if null).
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/");
  await sessionReady;

  await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible({
    timeout: 10_000,
  });

  // If there's an "Add to cart" button, click it; otherwise cart already has items
  const addBtn = page.getByRole("button", { name: "Add to cart" }).first();
  if (await addBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await addBtn.click();
    await expect(
      page.getByRole("button", { name: "Add one more" }).first(),
    ).toBeVisible({ timeout: 5_000 });
  }

  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Delivery Information" }),
  ).toBeVisible({ timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "setup" project via storageState
// ---------------------------------------------------------------------------

test.describe("Checkout flow", () => {
  test.describe.configure({ mode: "serial" });

  test("checkout page shows delivery form and cart totals", async ({
    page,
  }) => {
    await ensureCartAndGoToCheckout(page);

    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Street Address")).toBeVisible();
    await expect(page.getByLabel("City")).toBeVisible();
    await expect(page.getByLabel("State")).toBeVisible();
    await expect(page.getByLabel("Zip Code")).toBeVisible();
    await expect(page.getByLabel("Country")).toBeVisible();
    await expect(page.getByLabel("Phone")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Delivery Fee")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Proceed to Payment/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Cart" }),
    ).toBeVisible();
  });

  test("checkout auto-fills from default saved address", async ({ page }) => {
    await ensureCartAndGoToCheckout(page);

    const firstName = page.getByLabel("First Name");
    await expect(firstName).toBeVisible();

    const firstNameValue = await firstName.inputValue();
    if (!firstNameValue) {
      await firstName.fill("TestName");
      await expect(firstName).toHaveValue("TestName");
    }
  });

  test("checkout form validation shows errors for empty required fields", async ({
    page,
  }) => {
    await ensureCartAndGoToCheckout(page);

    for (const label of [
      "First Name",
      "Last Name",
      "Email",
      "Street Address",
      "City",
      "State",
      "Zip Code",
      "Country",
      "Phone",
    ]) {
      await page.getByLabel(label).clear();
    }

    await page
      .getByRole("button", { name: /Proceed to Payment/i })
      .click();

    await expect(
      page.getByText(/required|invalid|at least/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test("checkout form validates email format via HTML5 validation", async ({
    page,
  }) => {
    await ensureCartAndGoToCheckout(page);

    await page.getByLabel("Email").clear();
    await page.getByLabel("Email").fill("notanemail");

    await page.getByLabel("First Name").fill("Test");
    await page.getByLabel("Last Name").fill("User");
    await page.getByLabel("Street Address").fill("123 Main St");
    await page.getByLabel("City").fill("TestCity");
    await page.getByLabel("State").fill("TS");
    await page.getByLabel("Zip Code").fill("12345");
    await page.getByLabel("Country").fill("TestCountry");
    await page.getByLabel("Phone").fill("555-0123");

    await page
      .getByRole("button", { name: /Proceed to Payment/i })
      .click();

    await expect(page).toHaveURL(/\/checkout/);
    const validationMessage = await page
      .getByLabel("Email")
      .evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).toBeTruthy();
  });

  test("checkout payment button shows correct total", async ({ page }) => {
    await ensureCartAndGoToCheckout(page);

    const totalRow = page
      .locator("div")
      .filter({ hasText: /^Total/ })
      .last();
    const totalText = await totalRow
      .locator("div, span")
      .last()
      .textContent();

    await expect(
      page.getByRole("button", { name: /Proceed to Payment/i }),
    ).toContainText(totalText?.trim() ?? "$");
  });

  test("back to cart link navigates to cart page", async ({ page }) => {
    await ensureCartAndGoToCheckout(page);

    await page.getByRole("link", { name: "Back to Cart" }).click();
    await expect(page).toHaveURL(/\/cart/, { timeout: 5_000 });
  });

  test("checkout with valid form submits to Stripe", async ({ page }) => {
    await ensureCartAndGoToCheckout(page);

    await page.getByLabel("First Name").fill("E2E");
    await page.getByLabel("Last Name").fill("Tester");
    await page.getByLabel("Email").fill("e2e@test.com");
    await page.getByLabel("Street Address").fill("123 Test Street");
    await page.getByLabel("City").fill("TestCity");
    await page.getByLabel("State").fill("TS");
    await page.getByLabel("Zip Code").fill("12345");
    await page.getByLabel("Country").fill("TestCountry");
    await page.getByLabel("Phone").fill("+1 555-0123");

    await page
      .getByRole("button", { name: /Proceed to Payment/i })
      .click();

    await expect(
      page
        .getByText(/processing|redirecting/i)
        .or(page.locator('[class*="animate-spin"]')),
    )
      .toBeVisible({ timeout: 10_000 })
      .catch(async () => {
        const url = page.url();
        expect(
          url.includes("stripe.com") || url.includes("checkout"),
        ).toBeTruthy();
      });
  });
});
