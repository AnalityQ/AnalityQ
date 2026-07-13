import { describe, expect, it } from "vitest";
import { aggregateLastMatches } from "./aggregate";
import type { NormalizedTeamMatchStats } from "./types";

function match(id: number, date: string, overrides: Partial<NormalizedTeamMatchStats> = {}): NormalizedTeamMatchStats {
  return {
    fixtureId: id, date, opponentName: `Rywal ${id}`, opponentLogo: null, isHome: true,
    goalsFor: 1, goalsAgainst: 0, shotsFor: 10, shotsAgainst: 8,
    shotsOnTargetFor: 4, shotsOnTargetAgainst: 2, cornersFor: 5, cornersAgainst: 3,
    yellowCardsFor: 2, yellowCardsAgainst: 1, redCardsFor: 0, redCardsAgainst: 0,
    cardsFor: 2, cardsAgainst: 1, xgFor: 1.2, xgAgainst: 0.7,
    possessionFor: 55, possessionAgainst: 45, foulsFor: 11, foulsAgainst: 9,
    offsidesFor: 2, offsidesAgainst: 1, result: "W", ...overrides,
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
});
