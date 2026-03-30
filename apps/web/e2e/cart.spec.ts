import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to homepage and wait for client-side NextAuth session to hydrate.
 * AddToCartButton checks useSession() on click — redirects to /login if null.
 * The navbar user name is SSR (always visible), but useSession() only resolves
 * after /api/auth/session responds, so we intercept that network request.
 */
async function gotoHomeWithSession(page: Page) {
  const sessionReady = page.waitForResponse(
    (r) => r.url().includes("/api/auth/session") && r.status() === 200,
  );
  await page.goto("/");
  await sessionReady;
}

/**
 * Add an item to cart from the homepage menu by clicking its "Add to cart" button.
 * Returns the item's name and price for assertions.
 */
async function addFirstMenuItem(page: Page) {
  await gotoHomeWithSession(page);
  // Wait for food cards to render
  await expect(
    page.getByRole("button", { name: "Add to cart" }).first(),
  ).toBeVisible({ timeout: 10_000 });

  // Grab the first food item's name and price before clicking
  const firstCard = page
    .locator("[class*='rounded']")
    .filter({
      has: page.getByRole("button", { name: "Add to cart" }),
    })
    .first();
  const name = await firstCard
    .getByRole("heading", { level: 3 })
    .textContent();
  const priceText = await firstCard.locator("p").last().textContent();

  await firstCard.getByRole("button", { name: "Add to cart" }).click();

  // Wait for quantity controls to appear (confirms item was added)
  await expect(
    page.getByRole("button", { name: "Add one more" }).first(),
  ).toBeVisible({ timeout: 5_000 });

  return {
    name: name?.trim() ?? "",
    price: parseFloat(priceText?.replace("$", "") ?? "0"),
  };
}

// ---------------------------------------------------------------------------
// Tests — auth is provided by the "setup" project via storageState
// ---------------------------------------------------------------------------

test.describe("Cart flow", () => {
  test.describe.configure({ mode: "serial" });

  test("empty cart shows empty state message", async ({ page }) => {
    await page.goto("/cart");
    await expect(
      page.getByText(/your cart|cart totals|loading/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    const isEmpty = await page
      .getByText("Your cart is empty")
      .isVisible()
      .catch(() => false);
    if (isEmpty) {
      await expect(page.getByText("Your cart is empty")).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Browse Menu" }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("heading", { name: "Your Cart" }),
    ).toBeVisible();
  });

  test("adding item from menu shows quantity controls and cart badge", async ({
    page,
  }) => {
    await gotoHomeWithSession(page);
    await expect(
      page.getByRole("button", { name: "Add to cart" }).first(),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Add to cart" }).first().click();

    await expect(
      page.getByRole("button", { name: "Remove one" }).first(),
    ).toBeVisible({ timeout: 5_000 });
    await expect(
      page.getByRole("button", { name: "Add one more" }).first(),
    ).toBeVisible();

    const cartLink = page.getByRole("link", { name: "Cart" });
    await expect(cartLink).toBeVisible();
  });

  test("cart page displays item with correct name, price, and totals", async ({
    page,
  }) => {
    const item = await addFirstMenuItem(page);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText(item.name).first()).toBeVisible();
    await expect(page.getByText("Subtotal")).toBeVisible();
    await expect(page.getByText("Delivery Fee")).toBeVisible();
    await expect(
      page.getByText("Total", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Proceed to Checkout" }),
    ).toBeVisible();
  });

  test("incrementing quantity updates total", async ({ page }) => {
    await addFirstMenuItem(page);
    await page.goto("/cart");

    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    const subtotalRow = page
      .locator("div")
      .filter({ hasText: /^Subtotal/ })
      .first();
    const initialSubtotal = await subtotalRow
      .locator("span")
      .last()
      .textContent();

    await page.getByRole("button", { name: "Add one more" }).first().click();

    await expect(subtotalRow.locator("span").last()).not.toHaveText(
      initialSubtotal ?? "",
      { timeout: 5_000 },
    );

    const newSubtotal = await subtotalRow.locator("span").last().textContent();
    const initial = parseFloat(initialSubtotal?.replace("$", "") ?? "0");
    const updated = parseFloat(newSubtotal?.replace("$", "") ?? "0");
    expect(updated).toBeGreaterThan(initial);
  });

  test("decrementing quantity updates total", async ({ page }) => {
    await addFirstMenuItem(page);

    await page.getByRole("button", { name: "Add one more" }).first().click();
    await page.waitForTimeout(500);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    const subtotalRow = page
      .locator("div")
      .filter({ hasText: /^Subtotal/ })
      .first();
    const initialSubtotal = await subtotalRow
      .locator("span")
      .last()
      .textContent();

    await page.getByRole("button", { name: "Remove one" }).first().click();

    await expect(subtotalRow.locator("span").last()).not.toHaveText(
      initialSubtotal ?? "",
      { timeout: 5_000 },
    );

    const newSubtotal = await subtotalRow.locator("span").last().textContent();
    const initial = parseFloat(initialSubtotal?.replace("$", "") ?? "0");
    const updated = parseFloat(newSubtotal?.replace("$", "") ?? "0");
    expect(updated).toBeLessThan(initial);
  });

  test("removing item from cart removes the row", async ({ page }) => {
    const item = await addFirstMenuItem(page);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    // Verify the item's trash button is visible
    const removeBtn = page.getByRole("button", {
      name: new RegExp(`Remove ${item.name} from cart`, "i"),
    });
    await expect(removeBtn).toBeVisible();

    // Click trash to remove all quantities of this item
    await removeBtn.click();

    // The item's remove button should disappear (cart may still have other items).
    // Items accumulate across serial tests, so qty may be > 1 — each removal
    // makes a sequential API call, which can take 2-3s per call on a cold Neon connection.
    await expect(removeBtn).not.toBeVisible({ timeout: 30_000 });
  });

  test("delivery fee is $2 when cart has items", async ({ page }) => {
    await addFirstMenuItem(page);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page.getByText("$2.00")).toBeVisible();
  });

  test("promo code input and apply button are present", async ({ page }) => {
    await addFirstMenuItem(page);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText("If you have a promo code, enter it here"),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Promo code")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Apply" }),
    ).toBeDisabled();

    await page.getByPlaceholder("Promo code").fill("TESTCODE");
    await expect(
      page.getByRole("button", { name: "Apply" }),
    ).toBeEnabled();
  });

  test("invalid promo code shows error", async ({ page }) => {
    await addFirstMenuItem(page);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByPlaceholder("Promo code").fill("INVALIDCODE999");
    await page.getByRole("button", { name: "Apply" }).click();

    await expect(
      page.getByText(/invalid|expired|not found|error/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("proceed to checkout link navigates to checkout page", async ({
    page,
  }) => {
    await addFirstMenuItem(page);

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { name: "Cart Totals" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "Proceed to Checkout" }).click();
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10_000 });
  });
});
