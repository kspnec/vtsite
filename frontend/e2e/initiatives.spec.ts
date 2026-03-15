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
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/initiatives");
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Finitiatives/);
  });

  test("loads initiatives page when logged in", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await expect(page.getByText("Village Initiatives")).toBeVisible();
    await expect(page.getByText("Development projects by our village youngsters")).toBeVisible();
  });

  test("shows seed initiatives", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await expect(page.getByText("Village Library Project")).toBeVisible();
  });

  test("shows status filter tabs", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await expect(page.getByRole("button", { name: "All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ongoing" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Planned" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Completed" })).toBeVisible();
  });

  test("filter by Ongoing shows only ongoing initiatives", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await page.getByRole("button", { name: "Ongoing" }).click();
    await expect(page.getByText("Ongoing").first()).toBeVisible();
  });

  test("filter by Completed shows completed initiatives", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await page.getByRole("button", { name: "Completed" }).click();
    await expect(page.getByText("Completed").first()).toBeVisible();
  });

  test("initiatives link is in navbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Initiatives/ })).toBeVisible();
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

  test("create initiative button is disabled without a PIC", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    await page.getByRole("button", { name: /New Initiative/ }).click();
    await page.getByPlaceholder("Initiative title *").fill("No PIC Test");
    const createBtn = page.getByRole("button", { name: "Create Initiative" });
    await expect(createBtn).toBeDisabled();
    await expect(page.getByText("Select a Lead / PIC to create the initiative")).toBeVisible();
  });

  async function fillCreateFormWithPIC(page: Page, title: string) {
    await page.getByRole("button", { name: /New Initiative/ }).click();
    await page.getByPlaceholder("Initiative title *").fill(title);
    // Search for a member and select as PIC
    await page.getByPlaceholder("Search member name…").fill("Arjun");
    await page.getByRole("button", { name: /Arjun/ }).first().click();
  }

  test("admin can create a new initiative", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    await fillCreateFormWithPIC(page, "Test Initiative E2E");
    await page.getByRole("button", { name: "Create Initiative" }).click();
    // After creation, the form hides and the new initiative appears in the list
    await expect(page.getByText("Test Initiative E2E").first()).toBeVisible({ timeout: 8000 });
  });

  test("admin can delete an initiative", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    // Create a temporary initiative to delete
    await fillCreateFormWithPIC(page, "Delete Me E2E");
    await page.getByRole("button", { name: "Create Initiative" }).click();
    await expect(page.getByText("Delete Me E2E").first()).toBeVisible({ timeout: 8000 });

    // Delete it — accept the confirm dialog
    page.on("dialog", (dialog) => dialog.accept());
    // Find the delete button for the new initiative card
    const initiativeCard = page.locator(".glass.rounded-2xl", { hasText: "Delete Me E2E" });
    await initiativeCard.getByTitle("Delete initiative").click();
    // Initiative should disappear
    await expect(page.getByText("Delete Me E2E")).toHaveCount(0, { timeout: 5000 });
  });

  test("non-admin cannot see delete button on initiatives", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    const deleteButtons = page.getByTitle("Delete initiative");
    await expect(deleteButtons).toHaveCount(0);
  });

  test("clicking initiative title navigates to detail page", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await page.getByRole("link", { name: "Village Library Project" }).click();
    await expect(page).toHaveURL(/\/initiatives\/\d+/);
    await expect(page.getByText("Village Library Project")).toBeVisible();
    await expect(page.getByText("Participants")).toBeVisible();
    await expect(page.getByText("Progress Updates")).toBeVisible();
  });

  test("detail page shows back link to initiatives", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await page.getByRole("link", { name: "Village Library Project" }).click();
    await expect(page.getByRole("link", { name: /Back to Initiatives/ })).toBeVisible();
  });

  test("admin can add a progress update on detail page", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    await page.getByRole("link", { name: "Village Library Project" }).click();
    const input = page.getByPlaceholder("Post a progress update…");
    await expect(input).toBeVisible();
    // Use unique text to avoid strict-mode violations when tests run in parallel
    const updateText = `E2E progress ${Date.now()}`;
    await input.fill(updateText);
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.getByText(updateText)).toBeVisible({ timeout: 5000 });
  });

  test("non-admin cannot see progress update form on detail page", async ({ page }) => {
    await loginAs(page, MEMBER);
    await page.goto("/initiatives");
    await page.getByRole("link", { name: "Village Library Project" }).click();
    await expect(page.getByPlaceholder("Post a progress update…")).toHaveCount(0);
  });

  test("admin can change initiative status via dropdown", async ({ page }) => {
    await loginAs(page, ADMIN);
    await page.goto("/initiatives");
    // Create a test initiative as planned
    await fillCreateFormWithPIC(page, "Status Change E2E");
    // status defaults to planned
    await page.getByRole("button", { name: "Create Initiative" }).click();
    await expect(page.getByText("Status Change E2E").first()).toBeVisible({ timeout: 8000 });

    // Find the status dropdown for this card and change to ongoing
    const card = page.locator(".glass.rounded-2xl", { hasText: "Status Change E2E" });
    const statusSelect = card.getByTitle("Change status");
    await statusSelect.selectOption("ongoing");

    // Badge should now show Ongoing color (cyan text is applied via class)
    await expect(statusSelect).toHaveValue("ongoing");

    // Cleanup: delete the initiative
    page.on("dialog", (dialog) => dialog.accept());
    await card.getByTitle("Delete initiative").click();
    await expect(page.getByText("Status Change E2E")).toHaveCount(0, { timeout: 5000 });
  });
});
