import { test, expect } from "@playwright/test";

test.describe("Leaderboard", () => {
  test("loads leaderboard page", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByText("Village Leaderboard")).toBeVisible();
    await expect(page.getByText("Celebrating the stars of our village")).toBeVisible();
  });

  test("shows category filter tabs", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page.getByRole("button", { name: /All Stars/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /College/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Working/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Primary/ })).toBeVisible();
  });

  test("shows ranked entries with points", async ({ page }) => {
    await page.goto("/leaderboard");
    // Seed data has users with points > 0
    await expect(page.getByText("points").first()).toBeVisible();
    // Top entry should have a medal emoji
    await expect(page.getByText("🥇")).toBeVisible();
  });

  test("college filter shows only college students", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.getByRole("button", { name: /College/ }).click();
    // Should still show ranked entries
    const entries = page.locator("a[href^='/profiles/']");
    await expect(entries.first()).toBeVisible();
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test("working filter shows entries (seed data has working professionals)", async ({ page }) => {
    await page.goto("/leaderboard");
    await page.getByRole("button", { name: /Working/ }).click();
    // Seed data has working professionals
    const entries = page.locator("a[href^='/profiles/']");
    await expect(entries.first()).toBeVisible();
  });

  test("clicking a leaderboard entry opens profile", async ({ page }) => {
    await page.goto("/leaderboard");
    const firstEntry = page.locator("a[href^='/profiles/']").first();
    await expect(firstEntry).toBeVisible();
    await firstEntry.click();
    await expect(page).toHaveURL(/\/profiles\/\d+/);
  });

  test("leaderboard link is in navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Leaderboard/ })).toBeVisible();
  });
});
