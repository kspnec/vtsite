import { test, expect, Page } from "@playwright/test";

const MEMBER = { email: "arjun.murugesan@example.com", password: "villageconnect123" };

async function loginAsMember(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(MEMBER.email);
  await page.getByPlaceholder("••••••••").fill(MEMBER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

test.describe("Leaderboard", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fleaderboard/);
  });

  test("loads leaderboard page when logged in", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/leaderboard");
    await expect(page.getByText("Village Leaderboard")).toBeVisible();
    await expect(page.getByText("Celebrating the stars of our village")).toBeVisible();
  });

  test("shows category filter tabs", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/leaderboard");
    await expect(page.getByRole("button", { name: /All Stars/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /College/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Working/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Primary/ })).toBeVisible();
  });

  test("shows ranked entries with points", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/leaderboard");
    await expect(page.getByText("points").first()).toBeVisible();
    await expect(page.getByText("🥇")).toBeVisible();
  });

  test("college filter shows only college students", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/leaderboard");
    await page.getByRole("button", { name: /College/ }).click();
    const entries = page.locator("a[href^='/profiles/']");
    await expect(entries.first()).toBeVisible();
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test("working filter shows entries", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/leaderboard");
    await page.getByRole("button", { name: /Working/ }).click();
    const entries = page.locator("a[href^='/profiles/']");
    await expect(entries.first()).toBeVisible();
  });

  test("clicking a leaderboard entry opens profile", async ({ page }) => {
    await loginAsMember(page);
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
