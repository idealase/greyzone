import { getScenarioLocale, loadScenarioLocale, LOCALE_REGISTRY } from "./index";

describe("locales index", () => {
  beforeEach(() => {
    Object.keys(LOCALE_REGISTRY).forEach((key) => {
      delete LOCALE_REGISTRY[key];
    });
  });

  it("loads and caches baltic locale on demand", async () => {
    expect(getScenarioLocale("baltic-flashpoint-v1")).toBeNull();

    const locale = await loadScenarioLocale("baltic-flashpoint-v1");

    expect(locale?.scenario_id).toBe("baltic-flashpoint-v1");
    expect(getScenarioLocale("baltic-flashpoint-v1")).toBe(locale);
  });

  it("returns null for unknown scenario locale id", async () => {
    await expect(loadScenarioLocale("unknown-scenario")).resolves.toBeNull();
    expect(getScenarioLocale("unknown-scenario")).toBeNull();
  });
});
