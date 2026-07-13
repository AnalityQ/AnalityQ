import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiFootballFixture } from "./types";

vi.mock("server-only", () => ({}));

const providerMock = vi.hoisted(() => ({
  getFixtureDetails: vi.fn(),
  getTeamSeasonFixtures: vi.fn(),
  getTeamLastFixtures: vi.fn(),
  getFixtureBundles: vi.fn(),
  getStandings: vi.fn(),
  getTeamStatistics: vi.fn(),
  getInjuries: vi.fn(),
  getHeadToHead: vi.fn(),
  getPredictions: vi.fn(),
  getOdds: vi.fn(),
}));

vi.mock("./provider", () => ({
  getFootballDataProvider: () => providerMock,
}));

function selectedFixture(season?: number): ApiFootballFixture {
  return {
    fixture: {
      id: 99,
      date: "2026-07-13T19:00:00+02:00",
      status: { short: "NS" },
      venue: null,
    },
    league: { id: 1, name: "Liga", country: "Poland", season, standings: true },
    teams: {
      home: { id: 364, name: "Gospodarze", logo: "https://media.api-sports.io/football/teams/364.png" },
      away: { id: 365, name: "Goście", logo: "https://media.api-sports.io/football/teams/365.png" },
    },
    goals: { home: null, away: null },
    score: { halftime: { home: null, away: null }, fulltime: { home: null, away: null }, extratime: { home: null, away: null }, penalty: { home: null, away: null } },
    events: [],
    lineups: [],
    statistics: [],
    players: [],
  };
}

describe("buildFootballMatchImport", () => {
  beforeEach(() => {
    Object.values(providerMock).forEach((mock) => mock.mockReset());
    providerMock.getTeamSeasonFixtures.mockResolvedValue([]);
    providerMock.getTeamLastFixtures.mockResolvedValue([]);
    providerMock.getFixtureBundles.mockResolvedValue([]);
    providerMock.getStandings.mockResolvedValue([]);
    providerMock.getTeamStatistics.mockResolvedValue({});
    providerMock.getInjuries.mockResolvedValue([]);
    providerMock.getHeadToHead.mockResolvedValue([]);
    providerMock.getPredictions.mockResolvedValue([]);
    providerMock.getOdds.mockResolvedValue([]);
  });

  it("odrzuca wybrany mecz bez poprawnego sezonu", async () => {
    providerMock.getFixtureDetails.mockResolvedValue(selectedFixture());
    const { buildFootballMatchImport } = await import("./import-service");
    await expect(buildFootballMatchImport(99)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
      message: "Dostawca nie zwrócił sezonu wybranego meczu.",
    });
    expect(providerMock.getTeamSeasonFixtures).not.toHaveBeenCalled();
  });

  it("pobiera po jednym zestawie sezonowym i przekazuje sezon obu drużyn", async () => {
    providerMock.getFixtureDetails.mockResolvedValue(selectedFixture(2025));
    const { buildFootballMatchImport } = await import("./import-service");
    const result = await buildFootballMatchImport(99, true);

    expect(providerMock.getTeamSeasonFixtures).toHaveBeenNthCalledWith(
      1, 364, "2026-07-13T19:00:00+02:00", 2025, { refresh: true },
    );
    expect(providerMock.getTeamSeasonFixtures).toHaveBeenNthCalledWith(
      2, 365, "2026-07-13T19:00:00+02:00", 2025, { refresh: true },
    );
    expect(result.snapshot.fixture.season).toBe(2025);
    expect(result.snapshot.requestSummary.concurrencyLimit).toBe(4);
  });

  it("nie przerywa importu po awarii opcjonalnego endpointu", async () => {
    providerMock.getFixtureDetails.mockResolvedValue(selectedFixture(2026));
    providerMock.getInjuries.mockRejectedValue(new Error("provider unavailable"));
    const { buildFootballMatchImport } = await import("./import-service");
    const result = await buildFootballMatchImport(99);

    expect(result.snapshot.coverage.fixture.status).toBe("complete");
    expect(result.snapshot.coverage.injuries.status).toBe("error");
    expect(result.warnings.some((warning) => warning.includes("injuries"))).toBe(true);
  });
});
