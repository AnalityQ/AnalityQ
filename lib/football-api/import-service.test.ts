import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiFootballFixture } from "./types";

vi.mock("server-only", () => ({}));

const providerMock = vi.hoisted(() => ({
  getFixtureDetails: vi.fn(),
  getTeamLastFixtures: vi.fn(),
  getFixtureStatistics: vi.fn(),
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
    league: { id: 1, name: "Liga", country: "Polska", season },
    teams: {
      home: { id: 364, name: "Gospodarze" },
      away: { id: 365, name: "Goście" },
    },
    goals: { home: null, away: null },
  };
}

describe("buildFootballMatchImport", () => {
  afterEach(() => {
    providerMock.getFixtureDetails.mockReset();
    providerMock.getTeamLastFixtures.mockReset();
    providerMock.getFixtureStatistics.mockReset();
  });

  it("odrzuca wybrany mecz bez poprawnego sezonu", async () => {
    providerMock.getFixtureDetails.mockResolvedValue(selectedFixture());

    const { buildFootballMatchImport } = await import("./import-service");

    await expect(buildFootballMatchImport(99)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 502,
      message: "Dostawca nie zwrócił sezonu wybranego meczu.",
    });
    expect(providerMock.getTeamLastFixtures).not.toHaveBeenCalled();
  });

  it("przekazuje sezon wybranego meczu dla obu drużyn", async () => {
    providerMock.getFixtureDetails.mockResolvedValue(selectedFixture(2025));
    providerMock.getTeamLastFixtures.mockResolvedValue([]);

    const { buildFootballMatchImport } = await import("./import-service");
    await buildFootballMatchImport(99, true);

    expect(providerMock.getTeamLastFixtures).toHaveBeenNthCalledWith(
      1,
      364,
      "2026-07-13T19:00:00+02:00",
      2025,
      5,
      { refresh: true },
    );
    expect(providerMock.getTeamLastFixtures).toHaveBeenNthCalledWith(
      2,
      365,
      "2026-07-13T19:00:00+02:00",
      2025,
      5,
      { refresh: true },
    );
  });
});
