import { afterEach, describe, expect, it, vi } from "vitest";
import type { ApiFootballFixture } from "./types";

vi.mock("server-only", () => ({}));

const apiFootballRequestMock = vi.hoisted(() => vi.fn());
vi.mock("./client", () => ({ apiFootballRequest: apiFootballRequestMock }));

function fixture(id: number, date: string, status: string): ApiFootballFixture {
  return {
    fixture: {
      id,
      date,
      status: { short: status },
      venue: null,
    },
    league: { id: 1, name: "Liga", country: "Polska" },
    teams: {
      home: { id: 7, name: "Gospodarze" },
      away: { id: 8, name: "Goście" },
    },
    goals: { home: 1, away: 0 },
  };
}

describe("ApiFootballProvider.getTeamLastFixtures", () => {
  afterEach(() => {
    apiFootballRequestMock.mockReset();
  });

  it("wysyła sezon i zakres bez last/status oraz zwraca maksymalnie 5 zakończonych meczów", async () => {
    apiFootballRequestMock.mockResolvedValue([
      fixture(6, "2026-07-07T20:00:00Z", "FT"),
      fixture(3, "2026-07-10T20:00:00Z", "PEN"),
      fixture(8, "2026-07-06T20:00:00Z", "NS"),
      fixture(1, "2026-07-12T16:00:00Z", "FT"),
      fixture(7, "2026-07-13T17:00:00Z", "FT"),
      fixture(5, "2026-07-08T20:00:00Z", "FT"),
      fixture(2, "2026-07-11T20:00:00Z", "AET"),
      fixture(4, "2026-07-09T20:00:00Z", "FT"),
    ]);

    const { ApiFootballProvider } = await import("./provider");
    const result = await new ApiFootballProvider().getTeamLastFixtures(
      364,
      "2026-07-13T19:00:00+02:00",
      2025,
      9,
    );

    expect(apiFootballRequestMock).toHaveBeenCalledOnce();
    const params = apiFootballRequestMock.mock.calls[0]?.[1];
    expect(params).toEqual({
      team: 364,
      season: 2025,
      from: "2025-01-09",
      to: "2026-07-13",
      timezone: "Europe/Warsaw",
    });
    expect(params).not.toHaveProperty("last");
    expect(params).not.toHaveProperty("status");
    expect(result.map((item) => item.fixture.id)).toEqual([1, 2, 3, 4, 5]);
  });
});
