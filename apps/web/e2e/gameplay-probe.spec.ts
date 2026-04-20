import { test } from "@playwright/test";

const DIR = "e2e/screenshots/gameplay";
const TS = Date.now().toString().slice(-4);

test("gameplay probe", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push(e.message));

  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/login");
  await page.getByLabel("Callsign").fill("Probe" + TS);
  await page.getByLabel("Password").fill("probe123");
  await page.getByRole("button", { name: "Register" }).click();
  await page.waitForURL("/", { timeout: 10000 });

  await page.goto("/runs/new");
  await page.waitForTimeout(1000);
  await page.locator("#scenario").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Quick Start vs AI" }).click();
  await page.waitForURL(/\/runs\/[^/]+$/, { timeout: 30000 });
  await page.waitForSelector(".domain-action-bar", { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Dismiss briefing
  const briefing = page.getByRole("button", { name: "Understood" });
  if (await briefing.isVisible({ timeout: 5000 }).catch(() => false)) {
    await briefing.click(); await page.waitForTimeout(800);
  }

  await page.screenshot({ path: `${DIR}/01-initial.png` });

  // Open KIN action modal
  const kinBtn = page.locator(".domain-action-btn:not(.domain-action-btn--empty)").first();
  await kinBtn.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${DIR}/02-action-modal.png` });

  // Get RP before execute
  const rpBefore = await page.locator(".metric-card").filter({ hasText: "RESOURCES" }).locator(".metric-card__value, .metric-value, strong, b").first().textContent().catch(() => "?");

  // Execute first action
  const execBtn = page.getByRole("button", { name: "Execute" }).first();
  if (await execBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await execBtn.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: `${DIR}/03-after-execute.png` });

  // Close modal
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // End Turn → Confirm
  await page.getByRole("button", { name: "End Turn" }).click();
  await page.waitForTimeout(600);
  const confirmBtn = page.getByRole("button", { name: "Confirm" });
  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmBtn.click();
  }
  // Wait for turn processing
  await page.waitForTimeout(10000);
  await page.screenshot({ path: `${DIR}/04-after-turn1.png` });

  // Log event feed content
  const eventItems = await page.locator(".event-item, .event-feed__item, [class*='event']").allTextContents();
  console.log("EVENT FEED AFTER TURN 1:", JSON.stringify(eventItems.slice(0, 20)));

  // Get RP after turn
  const rpAfter = await page.locator(".metric-card").filter({ hasText: "RESOURCES" }).locator(".metric-card__value, .metric-value, strong, b").first().textContent().catch(() => "?");
  console.log("RP before action:", rpBefore, "| RP after turn:", rpAfter);

  // Get Psi after turn
  const psiVal = await page.locator(".metric-card").filter({ hasText: /ORDER|PSI|Ψ/i }).textContent().catch(() => "?");
  console.log("PSI after turn 1:", psiVal);

  // Check if AI moves panel appeared
  const aiPanel = await page.locator(".ai-panel, [class*='ai-move']").count();
  console.log("AI panel visible:", aiPanel > 0);

  await page.screenshot({ path: `${DIR}/05-event-feed-area.png` });

  // Second turn
  await page.getByRole("button", { name: "End Turn" }).click();
  await page.waitForTimeout(600);
  const confirm2 = page.getByRole("button", { name: "Confirm" });
  if (await confirm2.isVisible({ timeout: 3000 }).catch(() => false)) await confirm2.click();
  await page.waitForTimeout(10000);
  await page.screenshot({ path: `${DIR}/06-after-turn2.png` });

  const psi2 = await page.locator(".metric-card").filter({ hasText: /ORDER|PSI|Ψ/i }).textContent().catch(() => "?");
  console.log("PSI after turn 2:", psi2);
  console.log("CONSOLE ERRORS:", errors.slice(0, 10));
});
