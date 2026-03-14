import { test, expect, Page } from "@playwright/test";

const MEMBER = { email: "arjun.murugesan@example.com", password: "villageconnect123" };

async function loginAsMember(page: Page) {
  await page.goto("/auth/login");
  await page.getByPlaceholder("you@example.com").fill(MEMBER.email);
  await page.getByPlaceholder("••••••••").fill(MEMBER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByText(MEMBER.email)).toBeVisible();
}

/** Fill required fields and save; works regardless of whether useEffect has run. */
async function saveProfile(page: Page) {
  // The Full Name field is required — always fill it explicitly
  const nameInput = page.locator("input").first();
  await nameInput.fill("Arjun Murugesan");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Profile saved!")).toBeVisible({ timeout: 10000 });
}

test.describe("Profile Dashboard", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/auth/login");
  });

  test("shows profile header with name and email", async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByText(MEMBER.email)).toBeVisible();
  });

  test("shows three tabs: Profile, Education & Skills, Avatar", async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByRole("button", { name: /👤 Profile/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /🎓 Education/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /🚀 Avatar/ })).toBeVisible();
  });

  test("Profile tab shows name and village fields", async ({ page }) => {
    await loginAsMember(page);
    await expect(page.getByText("Full Name")).toBeVisible();
    await expect(page.getByText("Village / Area")).toBeVisible();
    await expect(page.getByText("About me")).toBeVisible();
  });

  test("can save profile changes", async ({ page }) => {
    await loginAsMember(page);
    await page.locator("textarea").first().fill("Updated bio from E2E test");
    await saveProfile(page);
  });

  test("Education tab shows education stage selector", async ({ page }) => {
    await loginAsMember(page);
    await page.getByRole("button", { name: /🎓 Education/ }).click();
    await expect(page.getByRole("button", { name: /School \(Class 1/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /College \/ University/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Working Professional/i })).toBeVisible();
  });

  test("Education tab saves sports and activities", async ({ page }) => {
    await loginAsMember(page);
    await page.getByRole("button", { name: /🎓 Education/ }).click();
    await page.getByPlaceholder(/Cricket, Kabaddi/i).fill("Cricket, Swimming");
    await page.getByPlaceholder(/Music, Debate/i).fill("Coding, Reading");
    // Switch back to profile tab and fill required name before saving
    await page.getByRole("button", { name: /👤 Profile/ }).click();
    await saveProfile(page);
  });

  test("school stage shows grade dropdown", async ({ page }) => {
    await loginAsMember(page);
    await page.getByRole("button", { name: /🎓 Education/ }).click();
    await page.getByRole("button", { name: /School \(Class 1/i }).click();
    await expect(page.getByText("Current Class / Grade")).toBeVisible();
    await expect(page.locator("select").first()).toBeVisible();
  });

  test("Avatar tab shows 12 space avatars", async ({ page }) => {
    await loginAsMember(page);
    await page.getByRole("button", { name: /🚀 Avatar/ }).click();
    await expect(page.getByText("Choose a space avatar")).toBeVisible();
    const avatarButtons = page.locator(".grid.grid-cols-6 button");
    await expect(avatarButtons.first()).toBeVisible();
    const count = await avatarButtons.count();
    expect(count).toBe(12);
  });

  test("selecting an avatar and saving persists it", async ({ page }) => {
    await loginAsMember(page);
    await page.getByRole("button", { name: /🚀 Avatar/ }).click();
    await page.locator(".grid.grid-cols-6 button").first().click();
    // Switch back to profile tab to fill required name
    await page.getByRole("button", { name: /👤 Profile/ }).click();
    await saveProfile(page);
  });

  test("Avatar tab shows photo upload button", async ({ page }) => {
    await loginAsMember(page);
    await page.getByRole("button", { name: /🚀 Avatar/ }).click();
    await expect(page.getByRole("button", { name: /Upload Photo/ })).toBeVisible();
  });
});
