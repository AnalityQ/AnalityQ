import { describe, expect, it } from "vitest";
import {
  generateMatchSignals,
  normalizeH2H,
  normalizeInjuries,
  normalizePlayerInsights,
  normalizeStandings,
} from "./snapshot";
import type {
  ApiFootballFixture,
  MatchInjuriesData,
  MatchPlayerInsights,
  TeamRecentData,
  TeamSampleAverages,
  TeamSampleSummary,
} from "./types";

const emptyAverages: TeamSampleAverages = {
  goalsFor: null, goalsAgainst: null, xgFor: null, xgAgainst: null,
  shotsFor: null, shotsAgainst: null, shotsOnTargetFor: null, shotsOnTargetAgainst: null,
  shotsOffTargetFor: null, blockedShotsFor: null, shotsInsideBoxFor: null,
  shotsOutsideBoxFor: null, cornersFor: null, cornersAgainst: null,
  yellowCardsFor: null, redCardsFor: null, cardsFor: null, cardsAgainst: null,
  foulsFor: null, possessionFor: null, goalkeeperSavesFor: null, totalPassesFor: null,
  accuratePassesFor: null, passAccuracyFor: null, halftimeGoalsFor: null,
  halftimeGoalsAgainst: null, secondHalfGoalsFor: null, secondHalfGoalsAgainst: null,
};

function recent(id: number, name: string, averages: Partial<TeamSampleAverages> = {}): TeamRecentData {
  const summary: TeamSampleSummary = {
    sampleSize: 5, wins: 3, draws: 1, losses: 1, points: 10, cleanSheets: 2,
    btts: 3, over25: 3, scoredFirst: 3, concededFirst: 1,
    cornersOver85: 4, cornersOver95: 3, cornersOver105: 2,
    averages: { ...emptyAverages, ...averages }, coverage: { firstGoal: 5 },
  };
  for (const key of Object.keys(averages) as Array<keyof TeamSampleAverages>) summary.coverage[key] = 5;
  return { team: { id, name }, matches: [], summary };
}

const noInjuries: MatchInjuriesData = {
  status: "unavailable",
  reason: "Dostawca nie udostępnił danych o absencjach dla tego meczu.",
  missing: [],
  questionable: [],
};

function fixture(id = 99): ApiFootballFixture {
  return {
    fixture: { id, date: "2026-07-13T19:00:00+02:00", status: { short: "NS" } },
    league: { id: 113, name: "Allsvenskan", country: "Sweden", season: 2026, standings: true },
    teams: { home: { id: 364, name: "Djurgardens IF" }, away: { id: 766, name: "Halmstad" } },
    goals: { home: null, away: null },
  };
}

describe("generator sygnałów", () => {
  it("używa nazw, wartości i liczebności próbki", () => {
    const signals = generateMatchSignals({
      homeName: "Djurgardens IF",
      awayName: "Halmstad",
      homeOverall: recent(364, "Djurgardens IF"),
      awayOverall: recent(766, "Halmstad"),
      homeVenue: recent(364, "Djurgardens IF", { cornersFor: 7.1 }),
      awayVenue: recent(766, "Halmstad", { cornersAgainst: 6 }),
      standings: null,
      h2h: null,
      injuries: noInjuries,
    });
    const corners = signals.find((signal) => signal.category === "corners");
    expect(corners?.title).toContain("Djurgardens IF");
    expect(corners?.evidence).toContain("7,1");
    expect(corners?.evidence).toContain("Halmstad");
    expect(corners?.coverage).toContain("5 meczów");
  });

  it("nie generuje sygnału rożnych bez obu wymaganych wartości", () => {
    const signals = generateMatchSignals({
      homeName: "Djurgardens IF",
      awayName: "Halmstad",
      homeOverall: recent(364, "Djurgardens IF"),
      awayOverall: recent(766, "Halmstad"),
      homeVenue: recent(364, "Djurgardens IF", { cornersFor: 7.1 }),
      awayVenue: recent(766, "Halmstad"),
      standings: null,
      h2h: null,
      injuries: noInjuries,
    });
    expect(signals.some((signal) => signal.category === "corners")).toBe(false);
  });
});

describe("normalizacja sekcji raportu", () => {
  it("buduje tabelę i mały kontekst wokół obu drużyn", () => {
    const rows = Array.from({ length: 10 }, (_, index) => ({
      rank: index + 1,
      team: { id: index === 3 ? 364 : index === 7 ? 766 : 1000 + index, name: `Drużyna ${index + 1}` },
      points: 30 - index,
      goalsDiff: 10 - index,
      form: "WWDLW",
      all: { played: 15, win: 8, draw: 3, lose: 4, goals: { for: 25, against: 16 } },
      home: { played: 8, win: 5, draw: 2, lose: 1, goals: { for: 15, against: 7 } },
      away: { played: 7, win: 3, draw: 1, lose: 3, goals: { for: 10, against: 9 } },
    }));
    const result = normalizeStandings([{ league: { id: 113, name: "Allsvenskan", country: "Sweden", season: 2026, standings: [rows] } }], fixture());
    expect(result.available).toBe(true);
    expect(result.home?.rank).toBe(4);
    expect(result.away?.rank).toBe(8);
    expect(result.contextRows.some((row) => row.rank === 2)).toBe(true);
    expect(result.contextRows.some((row) => row.rank === 10)).toBe(true);
  });

  it("rozróżnia nieobecnych i wątpliwych, nie zgadując brakujących danych", () => {
    const players: MatchPlayerInsights = { status: "unavailable", reason: null, home: [], away: [] };
    const result = normalizeInjuries([
      { player: { id: 1, name: "Jan Kowalski", type: "Missing Fixture", reason: "Suspended" }, team: { id: 364, name: "Djurgardens IF" } },
      { player: { id: 2, name: "Adam Nowak", type: "Questionable", reason: "Knock" }, team: { id: 766, name: "Halmstad" } },
    ], players);
    expect(result.missing).toHaveLength(1);
    expect(result.questionable).toHaveLength(1);
    expect(result.missing[0].playerPhoto).toBeNull();
    expect(result.missing[0].regularity).toBeNull();
  });

  it("normalizuje wynik do przerwy i statystyki H2H bez dorabiania braków", () => {
    const h2h = fixture(7);
    h2h.fixture.status.short = "FT";
    h2h.goals = { home: 2, away: 1 };
    h2h.score = { halftime: { home: 1, away: 0 }, fulltime: { home: 2, away: 1 } };
    const result = normalizeH2H([h2h], [], 2026, 364, 766);
    expect(result.matches[0]).toMatchObject({ halftimeHomeGoals: 1, halftimeAwayGoals: 0, btts: true, over25: true });
    expect(result.matches[0].totalCorners).toBeNull();
  });

  it("nie zamienia brakujących statystyk zawodnika na zero", () => {
    const match = fixture(8);
    match.players = [{
      team: match.teams.home,
      players: [{
        player: { id: 10, name: "Jan Kowalski", nationality: "Poland" },
        statistics: [{ games: { minutes: 90, rating: "7.2", position: "M" }, goals: { total: null } }],
      }],
    }];
    const result = normalizePlayerInsights([match], 364, 766);
    expect(result.home[0]).toMatchObject({ minutes: 90, averageRating: 7.2, goals: null, shots: null });
  });
});
