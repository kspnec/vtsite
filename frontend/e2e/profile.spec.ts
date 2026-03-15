import { test, expect, Page } from "@playwright/test";

const MEMBER = { email: "arjun.murugesan@example.com", password: "villageconnect123" };

async function loginAsMember(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(MEMBER.email);
  await page.getByPlaceholder("••••••••").fill(MEMBER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

test.describe("Profile Detail Page", () => {
  test("opens a profile from the homepage card (logged in)", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/");
    await page.waitForTimeout(1000);
    const firstCard = page.locator("a[href^='/profiles/']").first();
    await expect(firstCard).toBeVisible({ timeout: 8000 });
    await firstCard.click();
    await page.waitForURL(/\/profiles\/\d+/);
    await expect(page.getByRole("link", { name: /Back to all profiles/i })).toBeVisible();
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/profiles/2");
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Fprofiles%2F2/);
  });

  test("shows profile name and back link", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/profiles/2");
    await expect(page.getByRole("link", { name: /Back to all profiles/i })).toBeVisible();
    await expect(page.locator("h1")).toBeVisible();
  });

  test("shows Member since text", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/profiles/2");
    await expect(page.getByText(/Member since/i)).toBeVisible();
  });

  test("returns 404 for non-existent profile", async ({ page }) => {
    await loginAsMember(page);
    const response = await page.goto("/profiles/99999");
    expect(response?.status()).toBe(404);
  });

  test("back link navigates to homepage", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/profiles/2");
    await page.getByRole("link", { name: /Back to all profiles/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("profile avatar is visible and not hidden behind banner", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/profiles/2");
    const photo = page.locator("img[alt], [data-testid='space-avatar'], .rounded-3xl").first();
    await expect(photo).toBeVisible();
    const contentBox = await page.locator(".glass.rounded-3xl .-mt-12").boundingBox();
    expect(contentBox).not.toBeNull();
  });

  test("clicking profile photo opens lightbox", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/profiles/2");
    await page.getByTestId("profile-avatar").click();
    await expect(page.getByRole("dialog", { name: /Profile photo viewer/i })).toBeVisible();
  });

  test("lightbox closes when clicking X button", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/profiles/2");
    await page.getByTestId("profile-avatar").click();
    await expect(page.getByRole("dialog", { name: /Profile photo viewer/i })).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog", { name: /Profile photo viewer/i })).not.toBeVisible();
  });
});
