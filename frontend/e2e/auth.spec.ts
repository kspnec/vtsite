import { test, expect } from "@playwright/test";

const UNIQUE = Date.now();
const TEST_USER = {
  email: `e2e_${UNIQUE}@test.com`,
  password: "testpass123",
  full_name: "E2E Test User",
};

test.describe("Signup", () => {
  test("shows signup form", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("heading", { name: "Join Village Connect" })).toBeVisible();
    await expect(page.getByPlaceholder("Your full name")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("shows education stage picker", async ({ page }) => {
    await page.goto("/auth/signup");
    await expect(page.getByRole("button", { name: /School/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /College/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Working/ })).toBeVisible();
  });

  test("school stage shows grade selector", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("button", { name: /School/ }).click();
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("college stage shows domain and college name fields", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("button", { name: /College/ }).click();
    await expect(page.getByPlaceholder(/Anna University/i)).toBeVisible();
  });

  test("successful signup auto-logs in and shows pending dashboard", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByPlaceholder("Your full name").fill(TEST_USER.full_name);
    await page.getByPlaceholder("you@example.com").fill(TEST_USER.email);
    await page.getByPlaceholder("Min 6 chars").fill(TEST_USER.password);
    await page.getByPlaceholder("Repeat").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Join Village Connect" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(/pending admin approval/i)).toBeVisible();
  });

  test("shows error for duplicate email", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByPlaceholder("Your full name").fill("Duplicate User");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("Min 6 chars").fill("pass123");
    await page.getByPlaceholder("Repeat").fill("pass123");
    await page.getByRole("button", { name: "Join Village Connect" }).click();
    await expect(page.getByText(/already registered/i)).toBeVisible();
  });

  test("shows error when passwords don't match", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByPlaceholder("Your full name").fill("Test User");
    await page.getByPlaceholder("you@example.com").fill(`mismatch_${UNIQUE}@test.com`);
    await page.getByPlaceholder("Min 6 chars").fill("pass123");
    await page.getByPlaceholder("Repeat").fill("different");
    await page.getByRole("button", { name: "Join Village Connect" }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test("sign in link navigates to login", async ({ page }) => {
    await page.goto("/auth/signup");
    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/auth/login");
  });
});

test.describe("Login", () => {
  test("shows login form", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test("approved user login redirects to dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("villageconnect123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("link", { name: "My Profile" })).toBeVisible();
  });

  test("logged-in user sees their name in navbar", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByPlaceholder("you@example.com").fill("arjun.murugesan@example.com");
    await page.getByPlaceholder("••••••••").fill("villageconnect123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("link", { name: "My Profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
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
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  });
});
