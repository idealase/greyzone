import { formatPhase, formatDomain, formatPercent, formatOrderParameter } from "./formatters";
import { Phase } from "../types/phase";
import { DomainLayer } from "../types/domain";

describe("formatPhase", () => {
  it("returns full label for valid phase", () => {
    expect(formatPhase(Phase.CompetitiveNormality)).toBe(
      "Phase 0: Competitive Normality"
    );
  });

  it("returns full label for war phase", () => {
    expect(formatPhase(Phase.OvertInterstateWar)).toBe(
      "Phase 4: Overt Interstate War"
    );
  });

  it("returns raw value for unknown phase", () => {
    expect(formatPhase("UnknownPhase" as Phase)).toBe("UnknownPhase");
  });
});

describe("formatDomain", () => {
  it("returns human-readable label for domain", () => {
    expect(formatDomain(DomainLayer.Cyber)).toBe("Cyber");
  });

  it("returns label for multi-word domain", () => {
    expect(formatDomain(DomainLayer.MaritimeLogistics)).toBe(
      "Maritime & Logistics"
    );
  });

  it("returns raw value for unknown domain", () => {
    expect(formatDomain("FakeDomain" as DomainLayer)).toBe("FakeDomain");
  });
});

describe("formatPercent", () => {
  it("formats 0.5 as 50.0%", () => {
    expect(formatPercent(0.5)).toBe("50.0%");
  });

  it("formats 0 as 0.0%", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });

  it("formats 1 as 100.0%", () => {
    expect(formatPercent(1)).toBe("100.0%");
  });

  it("formats fractional values", () => {
    expect(formatPercent(0.333)).toBe("33.3%");
  });
});

describe("formatOrderParameter", () => {
  it("formats with psi symbol and three decimals", () => {
    expect(formatOrderParameter(0.5)).toBe("\u03A8 = 0.500");
  });

  it("formats zero", () => {
    expect(formatOrderParameter(0)).toBe("\u03A8 = 0.000");
  });

  it("formats near-one values", () => {
    expect(formatOrderParameter(0.999)).toBe("\u03A8 = 0.999");
  });
});
