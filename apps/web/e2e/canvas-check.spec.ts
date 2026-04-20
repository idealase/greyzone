import { test } from "@playwright/test";

test("check canvas size", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/login");
  await page.getByLabel("Callsign").fill("CanvasCheck" + Date.now().toString().slice(-4));
  await page.getByLabel("Password").fill("testpass123");
  await page.getByRole("button", { name: "Register" }).click();
  await page.waitForURL("/", { timeout: 10000 });
  await page.goto("/runs/new");
  await page.locator("#scenario").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Quick Start vs AI" }).click();
  await page.waitForURL(/\/runs\/[^/]+$/, { timeout: 30000 });
  await page.waitForTimeout(3000);
  
  // Dismiss briefing
  const btn = page.getByRole("button", { name: "Understood" });
  if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await btn.click();
    await page.waitForTimeout(1000);
  }

  const info = await page.evaluate(() => {
    const outer = document.querySelector(".battlespace-canvas");
    const canvas = document.querySelector("canvas");
    return {
      outer: outer ? { w: outer.getBoundingClientRect().width, h: outer.getBoundingClientRect().height } : null,
      canvas: canvas ? { w: canvas.getBoundingClientRect().width, h: canvas.getBoundingClientRect().height, inlineW: canvas.style.width, inlineH: canvas.style.height } : null,
      centerColW: document.querySelector(".sim-layout__center")?.getBoundingClientRect().width,
    };
  });
  console.log("Canvas info:", JSON.stringify(info, null, 2));
  
  await page.screenshot({ path: "e2e/screenshots/canvas-check.png", fullPage: false });
});
