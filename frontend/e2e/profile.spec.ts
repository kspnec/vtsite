import { test, expect } from "@playwright/test";

test.describe("Profile Detail Page", () => {
  test("opens a profile from the homepage card", async ({ page }) => {
    await page.goto("/");
    const firstCard = page.locator("a[href^='/profiles/']").first();
    await firstCard.click();
    await page.waitForURL(/\/profiles\/\d+/);
    await expect(page.getByRole("link", { name: /Back to all profiles/i })).toBeVisible();
  });

  test("shows profile name and back link", async ({ page }) => {
    await page.goto("/profiles/2");
    await expect(page.getByRole("link", { name: /Back to all profiles/i })).toBeVisible();
    // Should have a name heading
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows Member since text", async ({ page }) => {
    await page.goto("/profiles/2");
    await expect(page.getByText(/Member since/i)).toBeVisible();
  });

  test("returns 404 for non-existent profile", async ({ page }) => {
    const response = await page.goto("/profiles/99999");
    expect(response?.status()).toBe(404);
  });

  test("back link navigates to homepage", async ({ page }) => {
    await page.goto("/profiles/2");
    await page.getByRole("link", { name: /Back to all profiles/i }).click();
    await expect(page).toHaveURL("/");
  });
});
