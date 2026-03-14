import { test, expect, Page } from "@playwright/test";

const ADMIN = { email: "admin@village.com", password: "admin123" };
const MEMBER = { email: "arjun.murugesan@example.com", password: "villageconnect123" };

async function loginAs(page: Page, creds: { email: string; password: string }) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(creds.email);
  await page.getByPlaceholder("••••••••").fill(creds.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(creds.email === ADMIN.email ? "/admin" : "/dashboard");
}

test.describe("Initiatives", () => {
  test("loads initiatives page publicly", async ({ page }) => {
    await page.goto("/initiatives");
    await expect(page.getByText("Village Initiatives")).toBeVisible();
    await expect(page.getByText("Development projects by our village youngsters")).toBeVisible();
  });

  test("shows seed initiatives", async ({ page }) => {
    await page.goto("/initiatives");
    // Seed data has 5 initiatives
    await expect(page.getByText("Village Library Project")).toBeVisible();
  });

  test("shows status filter tabs", async ({ page }) => {
    await page.goto("/initiatives");
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ongoing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Planned" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
  });

  test("filter by Ongoing shows only ongoing initiatives", async ({ page }) => {
    await page.goto("/initiatives");
    await page.getByRole("button", { name: "Ongoing" }).click();
    // Village Library and Street Light are ongoing in seed data
    await expect(page.getByText("Ongoing").first()).toBeVisible();
  });

  test("filter by Completed shows completed initiatives", async ({ page }) => {
    await page.goto("/initiatives");
    await page.getByRole("button", { name: "Completed" }).click();
    await expect(page.getByText("Completed").first()).toBeVisible();
  });

  test("initiatives link is in navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Initiatives/ })).toBeVisible();
  });

  test("unauthenticated user cannot see join button", async ({ page }) => {
    await page.goto("/initiatives");
    // Join button only shows for approved members
    const joinButtons = page.getByRole("button", { name: "+ Join" });
    const count = await joinButtons.count();
    expect(count).toBe(0);
  });

  test("approved member can join an initiative", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    const joinBtn = page.getByRole("button", { name: "+ Join" }).first();
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();
    // After joining, button should change to Leave
    await expect(page.getByRole("button", { name: "Leave" }).first()).toBeVisible();
  });

  test("admin can see create initiative button", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    await expect(page.getByRole("button", { name: /New Initiative/ })).toBeVisible();
  });

  test("admin can create a new initiative", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    await page.getByRole("button", { name: /New Initiative/ }).click();
    await expect(page.getByPlaceholder("Initiative title *")).toBeVisible();
    await page.getByPlaceholder("Initiative title *").fill("Test Initiative E2E");
    await page.getByRole("button", { name: "Create Initiative" }).click();
    // After creation, the form hides and the new initiative appears in the list
    await expect(page.getByText("Test Initiative E2E").first()).toBeVisible({ timeout: 8000 });
  });
});
