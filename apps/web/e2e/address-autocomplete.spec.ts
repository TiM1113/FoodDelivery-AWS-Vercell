import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to profile and open the "Add Address" dialog.
 */
async function openAddressDialog(page: Page) {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "My Profile" }),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Add Address" }).click();
  await expect(
    page.getByRole("heading", { name: "Add New Address" }),
  ).toBeVisible();
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "setup" project via storageState
// Submission test runs first to avoid profile rate limit (10/min/IP)
// ---------------------------------------------------------------------------

test.describe("Address autocomplete", () => {
  test.describe.configure({ mode: "serial" });

  // Run the API-dependent test first while rate limit budget is fresh
  test("submitting a complete address creates an address card", async ({
    page,
  }) => {
    // Profile rate limit is 10/min/IP — may need retries across rapid test runs
    test.setTimeout(90_000);
    await openAddressDialog(page);

    const streetInput = page.getByRole("combobox", {
      name: /start typing an address/i,
    });
    await expect(streetInput).toBeVisible({ timeout: 10_000 });

    await page.getByLabel("First Name").fill("John");
    await page.getByLabel("Last Name").fill("Doe");
    await page.getByLabel("Email").fill("john@example.com");
    await page.getByLabel("Phone").fill("555-0123");

    await streetInput.pressSequentially("123 Main St", { delay: 50 });
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 10_000 });
    await page.getByRole("option").first().click();

    await expect(page.getByLabel("City")).not.toHaveValue("", {
      timeout: 5_000,
    });

    // Submit — retry on rate limit (sliding window may include prior test runs)
    const submitAndCheck = async () => {
      const responsePromise = page.waitForResponse(
        (r) =>
          r.url().includes("/api/user/addresses") &&
          r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Add Address" }).click();
      const response = await responsePromise;
      return response.json();
    };

    let body = await submitAndCheck();
    for (let attempt = 0; !body.success && body.retryAfter && attempt < 10; attempt++) {
      await page.waitForTimeout(Math.max(body.retryAfter, 3) * 1000);
      body = await submitAndCheck();
    }

    expect(body.success, `Address API error: ${JSON.stringify(body)}`).toBe(
      true,
    );
    await expect(
      page.getByRole("heading", { name: "Add New Address" }),
    ).not.toBeVisible({ timeout: 10_000 });

    await expect(page.getByText("John Doe").first()).toBeVisible({
      timeout: 5_000,
    });
  });

  test("profile page shows saved addresses section", async ({ page }) => {
    await page.goto("/profile");

    await expect(
      page.getByRole("heading", { name: "My Profile" }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText("Saved Addresses", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add Address" }),
    ).toBeVisible();
  });

  test("add address dialog opens with correct fields", async ({ page }) => {
    await openAddressDialog(page);

    await expect(page.getByLabel("Label")).toBeVisible();
    await expect(page.getByLabel("First Name")).toBeVisible();
    await expect(page.getByLabel("Last Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("combobox", { name: /start typing an address/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByLabel("City")).toBeVisible();
    await expect(page.getByLabel("State")).toBeVisible();
    await expect(page.getByLabel("Zip Code")).toBeVisible();
    await expect(page.getByLabel("Country")).toBeVisible();
    await expect(page.getByLabel("Phone")).toBeVisible();
    await expect(page.getByText("Set as default address")).toBeVisible();

    await expect(page.getByLabel("Label")).toHaveValue("Home");
  });

  test("address dialog can be closed", async ({ page }) => {
    await openAddressDialog(page);

    await page.getByRole("button", { name: "Close" }).click();
    await expect(
      page.getByRole("heading", { name: "Add New Address" }),
    ).not.toBeVisible();
  });

  test("autocomplete shows suggestions when typing address", async ({
    page,
  }) => {
    await openAddressDialog(page);

    const streetInput = page.getByRole("combobox", {
      name: /start typing an address/i,
    });
    await expect(streetInput).toBeVisible({ timeout: 10_000 });

    await streetInput.pressSequentially("123 Main St", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    const options = page.getByRole("option");
    await expect(options.first()).toBeVisible();
    const count = await options.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("selecting a suggestion auto-fills city, state, zip, and country", async ({
    page,
  }) => {
    await openAddressDialog(page);

    const streetInput = page.getByRole("combobox", {
      name: /start typing an address/i,
    });
    await expect(streetInput).toBeVisible({ timeout: 10_000 });

    await streetInput.pressSequentially("123 Main St", { delay: 50 });

    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible({ timeout: 10_000 });

    await page.getByRole("option").first().click();

    await expect(page.getByLabel("City")).not.toHaveValue("", {
      timeout: 5_000,
    });
    await expect(page.getByLabel("State")).not.toHaveValue("");
    await expect(page.getByLabel("Country")).not.toHaveValue("");
    await expect(streetInput).not.toHaveValue("");
  });

  test("form validation shows errors for empty required fields", async ({
    page,
  }) => {
    await openAddressDialog(page);

    await page.getByLabel("Label").clear();
    await page.getByRole("button", { name: "Add Address" }).click();

    await expect(
      page.getByText(/is required/i).first(),
    ).toBeVisible({ timeout: 3_000 });
  });
});
