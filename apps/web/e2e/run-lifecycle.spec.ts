import { test, expect } from "@playwright/test";

async function login(page: import("@playwright/test").Page, callsign: string) {
  await page.goto("/login");
  await page.getByLabel("Callsign").fill(callsign);
  await page.getByRole("button", { name: "Enter Battlespace" }).click();
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

test.describe("Run Lifecycle", () => {
  test("navigates to run creation page", async ({ page }) => {
    await login(page, "RunTestOp");
    await page.getByText("Start a New Run").click();
    await expect(page).toHaveURL("/runs/new");
    await expect(page.getByText("Create New Run")).toBeVisible();
  });

  test("run creation form has required fields", async ({ page }) => {
    await login(page, "RunFormOp");
    await page.goto("/runs/new");
    await expect(page.getByLabel("Scenario")).toBeVisible();
    await expect(page.getByLabel("Run Name")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Run" })).toBeVisible();
  });

  test("creates a run and reaches lobby", async ({ page }) => {
    await login(page, "LobbyTestOp");
    await page.goto("/runs/new");

    // Select first available scenario
    const scenarioSelect = page.getByLabel("Scenario");
    await scenarioSelect.selectOption({ index: 1 });

    // Fill run name
    await page.getByLabel("Run Name").fill("E2E Test Run");

    // Submit
    await page.getByRole("button", { name: "Create Run" }).click();

    // Should redirect to lobby
    await expect(page).toHaveURL(/\/runs\/.*\/lobby/, { timeout: 10000 });
    await expect(page.getByText("E2E Test Run")).toBeVisible();
    await expect(page.getByText("Waiting for players")).toBeVisible();
  });
});
