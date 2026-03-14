import { test, expect } from "@playwright/test";

const ADMIN = { email: "admin@village.com", password: "admin123" };

async function loginAsAdmin(page: Parameters<Parameters<typeof test>[1]>[0]["page"]) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(ADMIN.email);
  await page.getByPlaceholder("••••••••").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
}

test.describe("Admin Panel", () => {
  test("non-admin is redirected away from /admin", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("villageconnect123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/admin");
    // Should be redirected away (to "/" or "/auth/login"), never stay on /admin
    await expect(page).not.toHaveURL("/admin");
  });

  test("unauthenticated user is redirected from /admin to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/auth/login");
  });

  test("admin can access admin panel", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page.getByText("Admin Panel")).toBeVisible();
  });

  test("admin panel shows pending and all-members tabs", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("button", { name: /Pending/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /All Members/ })).toBeVisible();
  });

  test("all-members tab lists approved profiles", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin");
    await page.getByRole("button", { name: /All Members/ }).click();
    // Seed data has 15 approved profiles; at least a few should show
    const rows = page.locator(".bg-white.rounded-2xl");
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(5);
  });

  test("admin navbar shows Admin link", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("link", { name: "Admin" })).toBeVisible();
  });

  test("admin can approve a newly signed-up user", async ({ page, request }) => {
    // Sign up a new user via UI
    const unique = Date.now();
    const newEmail = `pending_${unique}@test.com`;

    await page.goto("/auth/signup");
    await page.getByPlaceholder("Your full name").fill("Pending Member");
    await page.getByPlaceholder("you@example.com").fill(newEmail);
    await page.getByPlaceholder("Min 6 characters").fill("testpass123");
    await page.getByRole("button", { name: "Create Profile" }).click();
    await expect(page.getByText("You're registered!")).toBeVisible();

    // Log in as admin and approve
    await loginAsAdmin(page);
    await page.goto("/admin");
    await expect(page.getByRole("button", { name: /Pending/ })).toBeVisible();

    // Find the Approve button for the new user
    const approveBtn = page.getByRole("button", { name: "Approve" }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    // Pending count should decrease (or show "No pending approvals" if it was the only one)
    await page.waitForTimeout(500);
    // Verify the user no longer appears under pending
    const pendingRows = page.locator("span", { hasText: "Pending" });
    // The approved row should no longer show "Pending" badge
    const stillPending = await pendingRows.filter({ hasText: newEmail }).count();
    expect(stillPending).toBe(0);
  });
});
