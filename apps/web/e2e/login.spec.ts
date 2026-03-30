import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("shows login page with GREYZONE heading", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "GREYZONE" })).toBeVisible();
    await expect(page.getByText("Distributed Battlespace Simulation")).toBeVisible();
  });

  test("shows New Operator form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("New Operator")).toBeVisible();
    await expect(page.getByLabel("Callsign")).toBeVisible();
    await expect(page.getByRole("button", { name: "Enter Battlespace" })).toBeVisible();
  });

  test("shows error when submitting empty callsign", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Enter Battlespace" }).click();
    await expect(page.getByText("Callsign is required")).toBeVisible();
  });

  test("creates operator and redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Callsign").fill("TestOperator");
    await page.getByRole("button", { name: "Enter Battlespace" }).click();
    await expect(page).toHaveURL("/", { timeout: 10000 });
    await expect(page.getByText("Welcome, TestOperator")).toBeVisible();
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
