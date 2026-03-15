import { test, expect, Page } from "@playwright/test";
import { cleanupTestUsers } from "./helpers";

test.afterAll(async () => {
  await cleanupTestUsers("onboard_");
});

// Each test needs its own unique email to avoid conflicts in parallel runs
function makeUser() {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    email: `onboard_${id}@test.com`,
    password: "testpass123",
    first_name: "Onboard",
    last_name: "T",
  };
}

async function signupFresh(page: Page) {
  const user = makeUser();
  await page.goto("/auth/signup");
  await page.getByPlaceholder("e.g. Arjun").fill(user.first_name);
  await page.getByPlaceholder("K").fill(user.last_name);
  await page.getByPlaceholder("you@example.com").fill(user.email);
  await page.getByPlaceholder("At least 6 characters").fill(user.password);
  await page.getByRole("button", { name: "Join VTRockers Connect" }).click();
  await expect(page).toHaveURL("/onboarding", { timeout: 8000 });
}

test.describe("Onboarding Wizard", () => {
  test("signup redirects to onboarding wizard", async ({ page }) => {
    await signupFresh(page);
    await expect(page.getByText("Hi Onboard!")).toBeVisible();
  });

  test("step 0 shows avatar grid with 12 avatars", async ({ page }) => {
    await signupFresh(page);
    // AvatarPicker renders a grid of buttons each containing a SpaceAvatarDisplay (img)
    await expect(page.getByText("Choose a space avatar")).toBeVisible();
    const avatarImgs = page.locator("img[alt^='cosmos-']");
    await expect(avatarImgs).toHaveCount(12, { timeout: 10000 });
  });

  test("selecting avatar shows preview", async ({ page }) => {
    await signupFresh(page);
    // Wait for DiceBear images to load, then click first avatar button
    await expect(page.locator("img[alt^='cosmos-']").first()).toBeVisible({ timeout: 10000 });
    await page.locator("img[alt^='cosmos-']").first().click();
    await expect(page.getByText("Looking good!")).toBeVisible();
  });

  test("skip all for now goes to dashboard", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: "Skip all for now" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("step 1 shows village area and phone fields", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await expect(page.getByPlaceholder(/North Street/)).toBeVisible();
    await expect(page.getByPlaceholder(/mobile number/i)).toBeVisible();
  });

  test("step 2 shows status picker with 5 options", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await expect(page.getByText("I am currently…")).toBeVisible();
    await expect(page.getByRole("button", { name: "Studying" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Working" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Business" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Farming" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Other" })).toBeVisible();
  });

  test("Studying shows only School and College sub-options (no Working)", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Studying" }).click();
    await expect(page.getByText("I am studying in…")).toBeVisible();
    await expect(page.getByRole("button", { name: "School" })).toBeVisible();
    await expect(page.getByRole("button", { name: "College" })).toBeVisible();
    // After selecting Studying, the only status button for "Working" is the top-level one
    // The education sub-section must NOT show a "Working" button
    const studyingSection = page.locator("text=I am studying in…").locator("..");
    await expect(studyingSection.getByRole("button", { name: "Working" })).toHaveCount(0);
  });

  test("School grade grid appears after selecting School", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Studying" }).click();
    await page.getByRole("button", { name: "School" }).click();
    await expect(page.getByText("Class / Grade")).toBeVisible();
    // Grade buttons 1-12 in a grid
    const gradeButtons = page.getByRole("button", { name: /^[1-9]$|^1[0-2]$/ });
    await expect(gradeButtons.first()).toBeVisible();
  });

  test("School name field appears after selecting a grade", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Studying" }).click();
    await page.getByRole("button", { name: "School" }).click();
    // Click grade 7 (use exact text to avoid matching "17")
    await page.locator("button", { hasText: /^7$/ }).click();
    await expect(page.getByPlaceholder(/Govt. High School/)).toBeVisible();
  });

  test("Working shows designation, company, and location fields", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Working" }).click();
    await expect(page.getByPlaceholder(/Software Engineer, Teacher/)).toBeVisible();
    await expect(page.getByPlaceholder(/TCS, Govt School/)).toBeVisible();
    await expect(page.getByPlaceholder(/Chennai, Coimbatore/)).toBeVisible();
  });

  test("Business shows business type, name, and location fields", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Business" }).click();
    await expect(page.getByPlaceholder(/Grocery shop, Tailoring/)).toBeVisible();
    await expect(page.getByPlaceholder(/Sri Murugan Stores/)).toBeVisible();
  });

  test("Farming shows crop type and location fields", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Farming" }).click();
    await expect(page.getByPlaceholder(/Rice, Sugarcane/)).toBeVisible();
    await expect(page.getByPlaceholder(/V.Muthampatti fields/)).toBeVisible();
  });

  test("Other shows free text field", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Other" }).click();
    await expect(page.getByPlaceholder(/Homemaker, Freelancer/)).toBeVisible();
  });

  test("Finish button saves and redirects to dashboard", async ({ page }) => {
    await signupFresh(page);
    await page.getByRole("button", { name: /Skip, choose later|Next/ }).click();
    await page.getByRole("button", { name: /Next/ }).click();
    await page.getByRole("button", { name: "Finish 🎉" }).click();
    await expect(page).toHaveURL("/dashboard", { timeout: 8000 });
  });
});
