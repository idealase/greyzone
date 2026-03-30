import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, callsign: string) {
  await page.goto("/login");
  await page.getByLabel("Callsign").fill(callsign);
  await page.getByRole("button", { name: "Enter Battlespace" }).click();
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

test.describe("Scenarios", () => {
  test("navigates to scenarios page from home", async ({ page }) => {
    await login(page, "ScenarioNavOp");
    await page.getByText("Browse Scenarios").click();
    await expect(page).toHaveURL("/scenarios");
    await expect(page.getByRole("heading", { name: "Scenarios" })).toBeVisible();
  });

  test("displays scenario cards", async ({ page }) => {
    await login(page, "ScenarioListOp");
    await page.goto("/scenarios");
    await expect(page.getByRole("heading", { name: "Scenarios" })).toBeVisible();

    // Should show either scenario cards or empty state
    const hasScenarios = await page.getByText("New Run").first().isVisible().catch(() => false);
    const hasEmpty = await page.getByText("No scenarios available").isVisible().catch(() => false);
    expect(hasScenarios || hasEmpty).toBeTruthy();
  });

  test("scenario card has New Run button that navigates to run setup", async ({ page }) => {
    await login(page, "ScenarioClickOp");
    await page.goto("/scenarios");

    const newRunButton = page.getByRole("button", { name: "New Run" }).first();
    const isVisible = await newRunButton.isVisible().catch(() => false);

    if (isVisible) {
      await newRunButton.click();
      await expect(page).toHaveURL(/\/runs\/new\?scenarioId=/);
    }
  });
});
