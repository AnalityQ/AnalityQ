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
  };
}

const statistics: ApiFootballTeamStatistics[] = [
  { team: { id: 10, name: "Gospodarze" }, statistics: [
    { type: "Total Shots", value: 12 }, { type: "Shots on Goal", value: "5" },
    { type: "Corner Kicks", value: 7 }, { type: "Yellow Cards", value: 2 },
    { type: "Red Cards", value: null }, { type: "Ball Possession", value: "57%" },
    { type: "expected_goals", value: "1.64" },
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
      result: "W",
    });
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
