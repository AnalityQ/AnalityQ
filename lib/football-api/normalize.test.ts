import { describe, expect, it } from "vitest";
import { normalizeFixtureStatistics } from "./normalize";
import type { ApiFootballFixture, ApiFootballTeamStatistics } from "./types";

function fixture(homeGoals: number | null, awayGoals: number | null): ApiFootballFixture {
  return {
    fixture: { id: 44, date: "2026-07-10T18:00:00Z", status: { short: "FT" } },
    league: { id: 2, name: "Liga", country: "Polska" },
    teams: {
      home: { id: 10, name: "Gospodarze", logo: "home.png" },
      away: { id: 20, name: "Goście", logo: "away.png" },
    },
    goals: { home: homeGoals, away: awayGoals },
    score: { halftime: { home: 1, away: 0 }, fulltime: { home: homeGoals, away: awayGoals } },
    events: [
      { time: { elapsed: 14 }, team: { id: 10, name: "Gospodarze" }, type: "Goal", detail: "Normal Goal" },
      { time: { elapsed: 32 }, team: { id: 10, name: "Gospodarze" }, type: "Card", detail: "Yellow Card" },
      { time: { elapsed: 68 }, team: { id: 10, name: "Gospodarze" }, type: "Card", detail: "Yellow Card" },
    ],
  };
}

const statistics: ApiFootballTeamStatistics[] = [
  { team: { id: 10, name: "Gospodarze" }, statistics: [
    { type: "Total Shots", value: 12 }, { type: "Shots on Goal", value: "5" },
    { type: "Corner Kicks", value: 7 }, { type: "Yellow Cards", value: 2 },
    { type: "Red Cards", value: null }, { type: "Ball Possession", value: "57%" },
    { type: "expected_goals", value: "1.64" }, { type: "Shots off Goal", value: 4 },
    { type: "Blocked Shots", value: 3 }, { type: "Shots insidebox", value: 8 },
    { type: "Shots outsidebox", value: 4 }, { type: "Goalkeeper Saves", value: 2 },
    { type: "Total passes", value: 440 }, { type: "Passes accurate", value: 382 },
    { type: "Passes %", value: "87%" }, { type: "goals_prevented", value: "0.71" },
  ] },
  { team: { id: 20, name: "Goście" }, statistics: [
    { type: "Shots Total", value: 8 }, { type: "Shots on Target", value: 2 },
    { type: "Corners", value: 3 }, { type: "Yellow Card", value: 1 },
    { type: "Expected Goals", value: 0.72 },
  ] },
];

describe("normalizeFixtureStatistics", () => {
  it("rozpoznaje gospodarza, przeciwnika, liczby, procenty i wynik W", () => {
    const result = normalizeFixtureStatistics(fixture(2, 1), statistics, 10);
    expect(result).toMatchObject({
      isHome: true,
      opponentName: "Goście",
      opponentLogo: "away.png",
      goalsFor: 2,
      goalsAgainst: 1,
      shotsFor: 12,
      shotsAgainst: 8,
      shotsOnTargetFor: 5,
      possessionFor: 57,
      xgFor: 1.64,
      shotsOffTargetFor: 4,
      blockedShotsFor: 3,
      shotsInsideBoxFor: 8,
      goalkeeperSavesFor: 2,
      passAccuracyFor: 87,
      halftimeGoalsFor: 1,
      cardsFirstHalfFor: 1,
      cardsSecondHalfFor: 1,
      firstGoal: "scored",
      result: "W",
    });
    expect(result.additionalStatistics.team).toEqual([
      expect.objectContaining({ label: "goals_prevented", value: 0.71 }),
    ]);
  });

  it("odwraca strony dla gości i rozpoznaje D oraz L", () => {
    expect(normalizeFixtureStatistics(fixture(1, 1), statistics, 20).result).toBe("D");
    expect(normalizeFixtureStatistics(fixture(3, 1), statistics, 20).result).toBe("L");
    expect(normalizeFixtureStatistics(fixture(1, 3), statistics, 20).result).toBe("W");
  });

  it("pozostawia brakujące statystyki jako null, a ręczne zero jako zero", () => {
    const result = normalizeFixtureStatistics(fixture(0, 0), [], 10);
    expect(result.goalsFor).toBe(0);
    expect(result.shotsFor).toBeNull();
    expect(result.xgFor).toBeNull();
    expect(result.cardsFor).toBeNull();
  });
});
