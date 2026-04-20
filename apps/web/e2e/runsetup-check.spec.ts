import { test } from "@playwright/test";
test("run setup page", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Callsign").fill("SetupCheck" + Date.now().toString().slice(-4));
  await page.getByLabel("Password").fill("pass123");
  await page.getByRole("button", { name: "Register" }).click();
  await page.waitForURL("/");
  await page.goto("/runs/new");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "e2e/screenshots/runsetup.png", fullPage: true });
});
