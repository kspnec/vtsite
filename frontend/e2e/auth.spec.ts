import { test, expect } from "@playwright/test";
import { cleanupTestUsers } from "./helpers";

const UNIQUE = Date.now();
const TEST_USER = {
  email: `e2e_${UNIQUE}@test.com`,
  password: "testpass123",
  first_name: "E2E",
  last_name: "T",
};

test.afterAll(async () => {
  await cleanupTestUsers("e2e_", "mismatch_");
});

test.describe("Signup", () => {
  test("shows simplified signup form with name and initial fields", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: "Join VTRockers Connect" })).toBeVisible();
    await expect(page.getByPlaceholder("e.g. Arjun")).toBeVisible();
    await expect(page.getByPlaceholder("K")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("At least 6 characters")).toBeVisible();
  });

  test("does not show education stage or username fields", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("button", { name: /School/ })).toHaveCount(0);
    await expect(page.getByPlaceholder(/username/i)).toHaveCount(0);
  });

  test("successful signup auto-logs in and shows pending dashboard", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByPlaceholder("e.g. Arjun").fill(TEST_USER.first_name);
    await page.getByPlaceholder("K").fill(TEST_USER.last_name);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("At least 6 characters").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Join VTRockers Connect" }).click();
    // After signup, user is redirected to onboarding wizard
    await expect(page).toHaveURL("/onboarding", { timeout: 8000 });
  });

  test("shows error for duplicate email", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByPlaceholder("e.g. Arjun").fill("Duplicate");
    await page.getByPlaceholder("K").fill("U");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("At least 6 characters").fill("pass123");
    await page.getByRole("button", { name: "Join VTRockers Connect" }).click();
    await expect(page.getByText(/already registered/i)).toBeVisible();
  });

  test("sign in link navigates to login", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/auth/login");
  });
});

test.describe("Login", () => {
  test("shows login form with email field", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Invalid credentials/i)).toBeVisible();
  });

  test("approved user login redirects to dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("villageconnect123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("join link navigates to signup", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: "Join us" }).click();
    await expect(page).toHaveURL("/auth/signup");
  });
});

test.describe("Logout", () => {
  test("logout clears session and returns to homepage", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("villageconnect123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.waitForLoadState("networkidle");
    // Open profile dropdown and click Sign Out
    await page.getByRole("button", { name: "Profile menu" }).click();
    await page.getByText("Sign Out").click();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible({ timeout: 5000 });
  });
});
