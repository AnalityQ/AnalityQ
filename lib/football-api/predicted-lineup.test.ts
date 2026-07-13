import { describe, expect, it } from "vitest";
import { predictTeamLineup, predictedAppearanceConfidence } from "./predicted-lineup";
import type { HistoricalTeamLineup, MatchInjuriesData, MatchPlayerInsights } from "./types";

const injuries: MatchInjuriesData = { status: "unavailable", reason: null, missing: [], questionable: [] };
const insights: MatchPlayerInsights = { status: "unavailable", reason: null, home: [], away: [] };

function team(sampleSize = 5): HistoricalTeamLineup {
  const positions = ["G", ...Array(4).fill("D"), ...Array(3).fill("M"), ...Array(3).fill("F")];
  return {
    teamId: 10,
    teamName: "Test FC",
    teamLogo: null,
    formation: "4-3-3",
    sampleSize,
    players: positions.map((position, index) => ({
      id: index + 1,
      name: `Zawodnik ${index + 1}`,
      number: index + 1,
      position,
      grid: null,
      playerPhoto: null,
      playerNationality: null,
      countryCode: null,
      captain: index === 0,
      starts: sampleSize,
      sampleSize,
    })),
  };
}

describe("przewidywany skład", () => {
  it("liczy pewność deterministycznie i obniża ją zawodnikowi wątpliwemu", () => {
    expect(predictedAppearanceConfidence(4, 5, undefined, false)).toBe(65);
    expect(predictedAppearanceConfidence(4, 5, undefined, true)).toBe(45);
  });

  it("buduje 11 zawodników zgodnie z najczęstszą formacją", () => {
    const result = predictTeamLineup(team(), injuries, insights);
    expect(result.available).toBe(true);
    expect(result.players).toHaveLength(11);
    expect(result.players.map((player) => player.grid)).toEqual([
      "1:1", "2:1", "2:2", "2:3", "2:4", "3:1", "3:2", "3:3", "4:1", "4:2", "4:3",
    ]);
  });

  it("nie przewiduje składu przy próbie mniejszej niż trzy mecze", () => {
    const result = predictTeamLineup(team(2), injuries, insights);
    expect(result.available).toBe(false);
    expect(result.reason).toBe("Brak wystarczających danych do wiarygodnego przewidywania składu.");
  });

  it("wyklucza potwierdzoną absencję i odmawia przewidywania bez pełnej jedenastki", () => {
    const result = predictTeamLineup(team(), {
      ...injuries,
      missing: [{
        playerId: 1,
        playerName: "Zawodnik 1",
        playerPhoto: null,
        playerPosition: "G",
        teamId: 10,
        teamName: "Test FC",
        teamLogo: null,
        type: "missing",
        reason: "Uraz",
        status: "Nieobecny",
        regularity: null,
      }],
    }, insights);
    expect(result.available).toBe(false);
  });
});
