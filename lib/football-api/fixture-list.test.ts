import { describe, expect, it } from "vitest";
import {
  filterFixtureSummaries,
  sortFixtureSummaries,
} from "./fixture-list";
import type { FootballFixtureSummary } from "./types";

function fixture(
  id: number,
  kickoff: string,
  status: string,
  homeTeam = `Gospodarze ${id}`,
): FootballFixtureSummary {
  return {
    id,
    leagueId: 3,
    leagueName: "UEFA Europa League",
    leagueCountry: "World",
    leagueLogo: null,
    leagueFlag: null,
    countryCode: null,
    season: 2026,
    round: null,
    referee: null,
    kickoff,
    timestamp: Math.floor(new Date(kickoff).getTime() / 1000),
    status,
    statusLong: status,
    venue: "Stadion",
    venueCity: null,
    homeTeam: { id: id * 2, name: homeTeam, logo: null, winner: null },
    awayTeam: { id: id * 2 + 1, name: `Goście ${id}`, logo: null, winner: null },
  };
}

describe("lista meczów w Studio", () => {
  it("pokazuje najpierw mecze trwające i nadchodzące", () => {
    const now = new Date("2026-07-16T10:00:00Z").getTime();
    const result = sortFixtureSummaries([
      fixture(1, "2026-07-16T08:00:00Z", "FT"),
      fixture(2, "2026-07-16T12:00:00Z", "NS"),
      fixture(3, "2026-07-16T09:30:00Z", "2H"),
      fixture(4, "2026-07-16T14:00:00Z", "CANC"),
    ], now);

    expect(result.map((item) => item.id)).toEqual([3, 2, 1, 4]);
  });

  it("wyszukuje bez rozróżniania znaków diakrytycznych", () => {
    const fixtures = [
      fixture(1, "2026-07-16T12:00:00Z", "NS", "Žilina"),
      fixture(2, "2026-07-16T14:00:00Z", "NS", "Raków Częstochowa"),
    ];

    expect(filterFixtureSummaries(fixtures, "zilina").map((item) => item.id)).toEqual([1]);
    expect(filterFixtureSummaries(fixtures, "rakow czestochowa").map((item) => item.id)).toEqual([2]);
  });
});
