import { describe, expect, it } from "vitest";
import { createEmptyAnalysis, normalizeAnalysis } from "./storage";

describe("zgodność starych analiz", () => {
  it("otwiera rekord bez snapshotu, logotypów i nowych sekcji", () => {
    const legacy = createEmptyAnalysis(1);
    legacy.basic.homeTeam = "Stara drużyna A";
    legacy.basic.awayTeam = "Stara drużyna B";
    legacy.dataSource = {
      provider: "API-Football",
      fixtureId: 10,
      homeTeamId: 1,
      awayTeamId: 2,
      fetchedAt: "2026-01-01T10:00:00Z",
      includedHomeFixtures: [1],
      includedAwayFixtures: [2],
      warnings: [],
    };
    const normalized = normalizeAnalysis(legacy, [legacy]);
    expect(normalized.basic.homeTeam).toBe("Stara drużyna A");
    expect(normalized.dataSource?.snapshot).toBeUndefined();
    expect(normalized.premiumSections.cornersAnalysis).toBe("");
  });
});
