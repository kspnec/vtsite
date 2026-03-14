import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads and shows the hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Our Village,")).toBeVisible();
    await expect(page.getByText("Our Pride")).toBeVisible();
  });

  test("displays profile cards", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("a[href^='/profiles/']");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("shows navbar with login and join buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Join" })).toBeVisible();
  });

  test("filter by Working status", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Working" }).click();
    await page.waitForURL(/current_status=job/);
    const cards = page.locator("a[href^='/profiles/']");
    await expect(cards.first()).toBeVisible();
    // All visible status badges should say "Working"
    const badges = page.locator("span", { hasText: /^Working/ });
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test("filter by Studying status", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Studying" }).click();
    await page.waitForURL(/current_status=studying/);
    const cards = page.locator("a[href^='/profiles/']");
    await expect(cards.first()).toBeVisible();
  });

  test("All filter resets to full list", async ({ page }) => {
    await page.goto("/?current_status=job");
    await page.getByRole("button", { name: "All" }).click();
    await page.waitForURL("/");
    const cards = page.locator("a[href^='/profiles/']");
    const count = await cards.count();
    expect(count).toBeGreaterThan(4);
  });
});
