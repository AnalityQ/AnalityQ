import { apiFootballRequest } from "./client";
import { footballCacheTtl } from "./cache";
import type {
  ApiFootballFixture,
  ApiFootballTeamSearchItem,
  ApiFootballTeamStatistics,
  FootballDataProvider,
  ProviderRequestOptions,
} from "./types";

const finishedStatuses = new Set(["FT", "AET", "PEN"]);

export class ApiFootballProvider implements FootballDataProvider {
  async getFixturesByDate(date: string, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballFixture[]>(
      "/fixtures",
      { date, timezone: "Europe/Warsaw" },
      { cacheTtlMs: footballCacheTtl.fixturesByDate, refresh: options?.refresh },
    );
  }

  async searchTeams(query: string, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballTeamSearchItem[]>(
      "/teams",
      { search: query },
      { cacheTtlMs: footballCacheTtl.teamSearch, refresh: options?.refresh },
    );
  }

  async getTeamLastFixtures(
    teamId: number,
    beforeDate: string,
    season: number,
    limit: number,
    options?: ProviderRequestOptions,
  ) {
    const before = new Date(beforeDate);
    const beforeTime = before.getTime();

    const toDate = Number.isNaN(beforeTime)
      ? beforeDate.slice(0, 10)
      : before.toISOString().slice(0, 10);

    const fromDate = Number.isNaN(beforeTime)
      ? undefined
      : new Date(beforeTime - 550 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);

    const fixtures = await apiFootballRequest<ApiFootballFixture[]>(
      "/fixtures",
      {
        team: teamId,
        season,
        from: fromDate,
        to: toDate,
        timezone: "Europe/Warsaw",
      },
      {
        cacheTtlMs: footballCacheTtl.teamLastFixtures,
        refresh: options?.refresh,
      },
    );

    return fixtures
      .filter((fixture) => {
        const kickoff = new Date(fixture.fixture.date).getTime();

        return (
          finishedStatuses.has(fixture.fixture.status.short) &&
          (Number.isNaN(beforeTime) || kickoff < beforeTime)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.fixture.date).getTime() -
          new Date(a.fixture.date).getTime(),
      )
      .slice(0, Math.min(5, Math.max(1, limit)));
  }

  async getFixtureStatistics(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballTeamStatistics[]>(
      "/fixtures/statistics",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.fixtureStatistics, refresh: options?.refresh },
    );
  }

  async getFixtureDetails(fixtureId: number, options?: ProviderRequestOptions) {
    const fixtures = await apiFootballRequest<ApiFootballFixture[]>(
      "/fixtures",
      { id: fixtureId, timezone: "Europe/Warsaw" },
      { cacheTtlMs: footballCacheTtl.fixtureDetails, refresh: options?.refresh },
    );
    return fixtures[0] || null;
  }
}

const provider = new ApiFootballProvider();

export function getFootballDataProvider(): FootballDataProvider {
  return provider;
}
