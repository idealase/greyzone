import { test, expect } from "@playwright/test";

const SCREENSHOT_DIR = "e2e/screenshots";
const CALLSIGN = "AuditBot" + Date.now().toString().slice(-4);
const PASSWORD = "testpass123";

async function loginOrRegister(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Callsign").fill(CALLSIGN);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

test.describe("Visual Audit", () => {
  test.setTimeout(120000);

  test("full gameplay flow vs AI", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Login
    await loginOrRegister(page);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-home.png`, fullPage: true });

    // Create game vs AI
    await page.goto("/runs/new");
    await page.waitForTimeout(1000);
    const scenarioSelect = page.locator("#scenario");
    await scenarioSelect.selectOption({ index: 1 });
    await page.getByRole("button", { name: "Quick Start vs AI" }).click();
    await page.waitForURL(/\/runs\/[^/]+$/, { timeout: 30000 });
    // Wait for the simulation to fully load (domain action bar is a good signal)
    await page.waitForSelector(".domain-action-bar, .battlespace-canvas", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Dismiss scenario briefing modal
    const understoodBtn = page.getByRole("button", { name: "Understood" });
    if (await understoodBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await understoodBtn.click();
      await page.waitForTimeout(1500);
    }

    // MAIN SIMULATION VIEW - this is what we need to see
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-sim-fullpage.png`, fullPage: true });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-sim-viewport.png`, fullPage: false });

    // Try to advance turn 1
    const advanceBtn = page.getByRole("button", { name: /advance turn|end turn/i });
    if (await advanceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await advanceBtn.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-after-turn1.png`, fullPage: true });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-after-turn1-viewport.png`, fullPage: false });

      // Dismiss After Action Report
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-post-dismiss.png`, fullPage: true });

      // Open action modal via domain action bar
      const firstDomainBtn = page.locator(".domain-action-btn:not(.domain-action-btn--empty)").first();
      if (await firstDomainBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstDomainBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/07-action-modal.png`, fullPage: false });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }

      // Advance turn 2
      if (await advanceBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await advanceBtn.click();
        await page.waitForTimeout(4000);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/08-after-turn2.png`, fullPage: true });
        await page.keyboard.press("Escape");
        await page.waitForTimeout(500);
      }
    }

    // Scroll exploration
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-top.png`, fullPage: false });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-middle.png`, fullPage: false });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-bottom.png`, fullPage: false });

    // Responsive: tablet
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-tablet-viewport.png`, fullPage: false });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-tablet-fullpage.png`, fullPage: true });

    // Responsive: narrower desktop (1280)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-narrow-desktop.png`, fullPage: false });
  });
});
