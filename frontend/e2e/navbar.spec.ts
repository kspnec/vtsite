import { test, expect, Page } from "@playwright/test";

const ADMIN = { email: "admin@village.com", password: "admin123" };
const MEMBER = { email: "arjun.murugesan@example.com", password: "villageconnect123" };

async function loginAs(page: Page, creds: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(creds.email);
  await page.getByPlaceholder("••••••••").fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(creds.email === ADMIN.email ? "/admin" : "/dashboard");
}

test.describe("Navbar — profile dropdown", () => {
  test("shows user first name in navbar when logged in", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    // "Arjun" should be visible in the nav (first name from "Arjun Murugesan")
    await expect(page.getByText("Arjun")).toBeVisible();
  });

  test("profile dropdown opens on click and shows full name + email", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    // Click the profile button (aria-label="Profile menu")
    await page.getByRole("button", { name: "Profile menu" }).click();
    await expect(page.getByText("Arjun Murugesan")).toBeVisible();
    await expect(page.getByText(MEMBER.email)).toBeVisible();
  });

  test("profile dropdown contains My Profile and Sign Out", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    await page.getByRole("button", { name: "Profile menu" }).click();
    await expect(page.getByText("My Profile")).toBeVisible();
    await expect(page.getByText("Sign Out")).toBeVisible();
  });

  test("admin sees Admin Panel in profile dropdown", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/");
    await page.getByRole("button", { name: "Profile menu" }).click();
    await expect(page.getByText("Admin Panel")).toBeVisible();
  });

  test("clicking My Profile navigates to dashboard", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    await page.getByRole("button", { name: "Profile menu" }).click();
    await page.getByText("My Profile").click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("Sign Out logs the user out", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    await page.getByRole("button", { name: "Profile menu" }).click();
    await page.getByText("Sign Out").click();
    // Should navigate to "/" and show Login link
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Navbar — notification bell", () => {
  test("notification bell is visible when logged in", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible();
  });

  test("notification bell is not visible when logged out", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Notifications" })).toHaveCount(0);
  });

  test("clicking notification bell opens the dropdown", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/");
    await page.getByRole("button", { name: "Notifications" }).click();
    await expect(page.getByText("Notifications")).toBeVisible();
  });
});
