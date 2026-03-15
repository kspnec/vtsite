import { test, expect, Page } from "@playwright/test";
import { cleanupTestUsers } from "./helpers";

const ADMIN = { email: "admin@village.com", password: "admin123" };

async function loginAsAdmin(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(ADMIN.email);
  await page.getByPlaceholder("••••••••").fill(ADMIN.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // Admin is redirected to /admin (not /dashboard) after login
  await expect(page).toHaveURL("/admin");
}

test.afterAll(async () => {
  await cleanupTestUsers("pending_");
});

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
    await expect(page.getByText("Admin Panel")).toBeVisible();
  });

  test("admin panel shows pending and all-members tabs", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole("button", { name: /Pending/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /All Members/ })).toBeVisible();
  });

  test("all-members tab lists approved profiles", async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /All Members/ }).click();
    // Seed data has 15 approved profiles; at least a few should show
    const rows = page.locator(".glass.rounded-2xl");
    await expect(rows.first()).toBeVisible();
    const count = await rows.count();
    expect(count).toBeGreaterThan(5);
  });

  test("admin navbar shows Admin Panel link in profile dropdown", async ({ page }) => {
    await loginAsAdmin(page);
    // Open the profile dropdown
    await page.getByRole("button", { name: "Profile menu" }).click();
    await expect(page.getByRole("link", { name: "Admin Panel" })).toBeVisible();
  });

  test("admin can approve a newly signed-up user", async ({ page, request }) => {
    // Use unique email to avoid conflicts in parallel test runs
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newEmail = `pending_${id}@test.com`;
    const signupRes = await request.post("http://localhost:8000/auth/signup", {
      data: { email: newEmail, password: "testpass123", full_name: "Pending Approval" },
    });
    expect(signupRes.ok()).toBeTruthy();

    // Log in as admin and go to pending tab
    await loginAsAdmin(page);
    await page.getByRole("button", { name: /Pending/ }).click();
    await page.waitForLoadState("networkidle");

    // Wait for the pending user row containing the new email to appear
    const userRow = page.locator(".glass.rounded-2xl", { hasText: newEmail });
    await expect(userRow).toBeVisible({ timeout: 10000 });

    // Click Approve on that specific row
    await userRow.getByRole("button", { name: "Approve" }).click();

    // After approval the page re-fetches; switch to All Members to confirm
    await page.getByRole("button", { name: /All Members/ }).click();
    await page.waitForLoadState("networkidle");
    // The approved user should now appear in All Members
    await expect(page.locator(".glass.rounded-2xl", { hasText: newEmail })).toBeVisible({ timeout: 8000 });
  });
});
