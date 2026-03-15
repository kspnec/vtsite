import { test, expect, Page } from "@playwright/test";

const MEMBER = { email: "arjun.murugesan@example.com", password: "villageconnect123" };

async function loginAsMember(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(MEMBER.email);
  await page.getByPlaceholder("••••••••").fill(MEMBER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

test.describe("Homepage", () => {
  test("shows village overview hero for logged-out users", async ({ page }) => {
    await page.goto("/");
    // Use heading role to avoid issues with gradient-text CSS (color: transparent)
    await expect(page.getByRole("heading", { name: /VTRockers/ })).toBeVisible();
    await expect(page.getByText("Rich in Agriculture")).toBeVisible();
    await expect(page.getByText("Rising Educators")).toBeVisible();
    await expect(page.getByText("Spirit of Unity")).toBeVisible();
  });

  test("logged-out users see CTA to join, not profile cards", async ({ page }) => {
    await page.goto("/");
    // Should show join CTA instead of member profiles
    await expect(page.getByText("Join the Community")).toBeVisible();
    await expect(page.getByText("Meet Your Villagers")).toBeVisible();
    // Should NOT show profile cards
    const cards = page.locator("a[href^='/profiles/']");
    await expect(cards).toHaveCount(0);
  });

  test("logged-in users see the members grid", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/");
    await page.waitForTimeout(1000); // wait for client fetch
    const cards = page.locator("a[href^='/profiles/']");
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(4);
  });

  test("shows navbar with login and join buttons when logged out", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible({ timeout: 8000 });
    // Two "Join" links exist (desktop + mobile nav) — just check one is visible
    await expect(page.getByRole("link", { name: "Join" }).first()).toBeVisible({ timeout: 8000 });
  });

  test("village scene tiles are visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Morning Sunrise")).toBeVisible();
    await expect(page.getByText("Village Temple")).toBeVisible();
  });

  test("filter by Working status (logged-in)", async ({ page }) => {
    await loginAsMember(page);
    await page.goto("/");
    await page.waitForTimeout(800);
    await page.getByRole("button", { name: "Working" }).click();
    await page.waitForURL(/current_status=job/);
    const cards = page.locator("a[href^='/profiles/']");
    await expect(cards.first()).toBeVisible({ timeout: 8000 });
  });
});
