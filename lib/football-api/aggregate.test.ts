import { describe, expect, it } from "vitest";
import { aggregateLastMatches, summarizeTeamSample } from "./aggregate";
import type { NormalizedTeamMatchStats } from "./types";

function match(id: number, date: string, overrides: Partial<NormalizedTeamMatchStats> = {}): NormalizedTeamMatchStats {
  return {
    fixtureId: id, date, leagueName: "Liga", opponentName: `Rywal ${id}`, opponentLogo: null,
    teamLogo: null, isHome: true, status: "FT",
    goalsFor: 1, goalsAgainst: 0, shotsFor: 10, shotsAgainst: 8,
    halftimeGoalsFor: 1, halftimeGoalsAgainst: 0, secondHalfGoalsFor: 0, secondHalfGoalsAgainst: 0,
    shotsOnTargetFor: 4, shotsOnTargetAgainst: 2, cornersFor: 5, cornersAgainst: 3,
    shotsOffTargetFor: 4, shotsOffTargetAgainst: 4, blockedShotsFor: 2, blockedShotsAgainst: 2,
    shotsInsideBoxFor: 7, shotsInsideBoxAgainst: 5, shotsOutsideBoxFor: 3, shotsOutsideBoxAgainst: 3,
    yellowCardsFor: 2, yellowCardsAgainst: 1, redCardsFor: 0, redCardsAgainst: 0,
    cardsFor: 2, cardsAgainst: 1, xgFor: 1.2, xgAgainst: 0.7,
    possessionFor: 55, possessionAgainst: 45, foulsFor: 11, foulsAgainst: 9,
    offsidesFor: 2, offsidesAgainst: 1, goalkeeperSavesFor: 2, goalkeeperSavesAgainst: 3,
    totalPassesFor: 450, totalPassesAgainst: 390, accuratePassesFor: 390, accuratePassesAgainst: 320,
    passAccuracyFor: 87, passAccuracyAgainst: 82, cardsFirstHalfFor: 1, cardsSecondHalfFor: 1,
    firstGoal: "scored", additionalStatistics: { team: [], opponent: [] }, result: "W", ...overrides,
  };
}

describe("aggregateLastMatches", () => {
  it("sumuje maksymalnie 5 meczów, a najnowszą formę umieszcza po lewej", () => {
    const result = aggregateLastMatches([
      match(1, "2026-07-01", { result: "L" }), match(2, "2026-07-02", { result: "D" }),
      match(3, "2026-07-03", { result: "W" }), match(4, "2026-07-04", { result: "L" }),
      match(5, "2026-07-05", { result: "D" }), match(6, "2026-07-06", { result: "W" }),
    ]);
    expect(result.matchesCount).toBe(5);
    expect(result.goalsForLast5).toBe(5);
    expect(result.formLast5).toBe("W,D,L,W,D");
  });

  it("nie zamienia brakującego xG na zero i liczy coverage", () => {
    const result = aggregateLastMatches([
      match(1, "2026-07-01", { xgFor: null, xgAgainst: null }),
      match(2, "2026-07-02", { xgFor: 1.4, xgAgainst: 0.9 }),
      match(3, "2026-07-03", { xgFor: null, xgAgainst: null, shotsOnTargetFor: null, shotsOnTargetAgainst: null }),
    ]);
    expect(result.xgForLast5).toBe(1.4);
    expect(result.coverage.xg).toBe(1);
    expect(result.coverage.shotsOnTarget).toBe(2);
    expect(result.averages.xgForLast5).toBe(1.4);
  });

  it("liczy bilans, wskaźniki bramkowe, pierwszą bramkę i progi rożnych", () => {
    const result = summarizeTeamSample([
      match(1, "2026-07-01", { result: "W", goalsFor: 3, goalsAgainst: 1, cornersFor: 7, cornersAgainst: 4, firstGoal: "scored" }),
      match(2, "2026-07-02", { result: "D", goalsFor: 0, goalsAgainst: 0, cornersFor: 4, cornersAgainst: 3, firstGoal: "none" }),
      match(3, "2026-07-03", { result: "L", goalsFor: 1, goalsAgainst: 2, cornersFor: 5, cornersAgainst: 5, firstGoal: "conceded" }),
    ]);
    expect(result).toMatchObject({ wins: 1, draws: 1, losses: 1, points: 4, cleanSheets: 1, btts: 2, over25: 2, scoredFirst: 1, concededFirst: 1, cornersOver85: 2 });
    expect(result.averages.goalsFor).toBeCloseTo(4 / 3);
  });
});
