import { describe, expect, it } from "vitest";
import { applyFootballImportToAnalysis, applyFootballRefreshToAnalysis } from "./apply-import";
import { createEmptyAnalysis } from "../storage";
import type { AggregatedLastMatches, FootballAnalysisSnapshot, FootballMatchImport } from "./types";

const aggregate: AggregatedLastMatches = {
  matchesCount: 2, goalsForLast5: 3, goalsAgainstLast5: 1, cornersForLast5: 9,
  cornersAgainstLast5: 6, cardsForLast5: 4, cardsAgainstLast5: 3, shotsForLast5: 21,
  shotsAgainstLast5: 14, shotsOnTargetForLast5: 9, shotsOnTargetAgainstLast5: 5,
  xgForLast5: 2.8, xgAgainstLast5: 1.2, formLast5: "W,D",
  coverage: { goals: 2, shots: 2, shotsOnTarget: 2, corners: 2, cards: 2, xg: 1 },
  averages: { goalsForLast5: 1.5, goalsAgainstLast5: .5, cornersForLast5: 4.5,
    cornersAgainstLast5: 3, cardsForLast5: 2, cardsAgainstLast5: 1.5,
    shotsForLast5: 10.5, shotsAgainstLast5: 7, shotsOnTargetForLast5: 4.5,
    shotsOnTargetAgainstLast5: 2.5, xgForLast5: 2.8, xgAgainstLast5: 1.2 },
};

const imported: FootballMatchImport = {
  fixture: { id: 99, leagueId: 4, leagueName: "Liga", leagueCountry: "Polska", kickoff: "2026-07-12T18:30:00Z", status: "NS", venue: "Stadion", homeTeam: { id: 1, name: "Gospodarze" }, awayTeam: { id: 2, name: "Goście" } },
  home: { team: { id: 1, name: "Gospodarze" }, matches: [], aggregate },
  away: { team: { id: 2, name: "Goście" }, matches: [], aggregate },
  snapshot: { version: 2, fixture: { countryName: "Polska" } } as FootballAnalysisSnapshot,
  fetchedAt: "2026-07-11T18:40:00Z", warnings: [], cache: { refreshed: false, persistent: false },
};

describe("applyFootballImportToAnalysis", () => {
  it("mapuje dane do formularza i ustawia sourceMode api bez publikacji", () => {
    const result = applyFootballImportToAnalysis(createEmptyAnalysis(1), imported);
    expect(result.sourceMode).toBe("api");
    expect(result.publicationStatus).toBe("draft");
    expect(result.basic).toMatchObject({ league: "Liga", homeTeam: "Gospodarze", awayTeam: "Goście", venue: "Stadion" });
    expect(result.manualStats.home.formLast5).toBe("W,D");
    expect(result.dataSource?.coverage?.home.xgForLast5).toBe(1);
  });

  it("ustawia sourceMode mixed, gdy zastępuje dane ręczne", () => {
    const manual = createEmptyAnalysis(1);
    manual.basic.league = "Wpis ręczny";
    expect(applyFootballImportToAnalysis(manual, imported).sourceMode).toBe("mixed");
  });

  it("odświeża tylko wybrany zakres i zachowuje ręcznie zmienione dane meczu", () => {
    const initialSnapshot = {
      ...imported.snapshot,
      odds: { bookmaker: "Stare kursy" },
      coverage: { odds: { status: "partial", samples: 1, message: "stare" } },
      warnings: [],
      fetchedAt: "2026-07-11T18:40:00Z",
    } as FootballAnalysisSnapshot;
    const refreshedSnapshot = {
      ...initialSnapshot,
      odds: { bookmaker: "Nowe kursy" },
      coverage: { odds: { status: "complete", samples: 4, message: "nowe" } },
      fetchedAt: "2026-07-12T10:00:00Z",
    } as FootballAnalysisSnapshot;
    const analysis = applyFootballImportToAnalysis(createEmptyAnalysis(1), { ...imported, snapshot: initialSnapshot });
    analysis.basic.venue = "Ręcznie poprawiony stadion";

    const result = applyFootballRefreshToAnalysis(analysis, {
      ...imported,
      snapshot: refreshedSnapshot,
      fetchedAt: refreshedSnapshot.fetchedAt,
    }, "odds");

    expect(result.basic.venue).toBe("Ręcznie poprawiony stadion");
    expect(result.dataSource?.snapshot?.odds).toEqual({ bookmaker: "Nowe kursy" });
    expect(result.dataSource?.snapshot?.coverage.odds.status).toBe("complete");
    expect(result.publicationStatus).toBe("draft");
  });
});
