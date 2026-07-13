import { apiFootballRequest } from "./client";
import { footballCacheTtl } from "./cache";
import type {
  ApiFootballEvent,
  ApiFootballFixture,
  ApiFootballFixturePlayers,
  ApiFootballInjury,
  ApiFootballLineup,
  ApiFootballOdds,
  ApiFootballPrediction,
  ApiFootballStandingsResponse,
  ApiFootballTeamSearchItem,
  ApiFootballTeamSeasonStatistics,
  ApiFootballTeamStatistics,
  FootballDataProvider,
  ProviderRequestOptions,
} from "./types";

const finishedStatuses = new Set(["FT", "AET", "PEN"]);
const dayMs = 24 * 60 * 60 * 1000;

function historyRange(beforeDate: string) {
  const before = new Date(beforeDate);
  const beforeTime = before.getTime();
  return {
    beforeTime,
    toDate: Number.isNaN(beforeTime)
      ? beforeDate.slice(0, 10)
      : before.toISOString().slice(0, 10),
    fromDate: Number.isNaN(beforeTime)
      ? undefined
      : new Date(beforeTime - 550 * dayMs).toISOString().slice(0, 10),
  };
}

function finishedBefore(fixtures: ApiFootballFixture[], beforeTime: number) {
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
        new Date(b.fixture.date).getTime() - new Date(a.fixture.date).getTime(),
    );
}

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

  async getTeamSeasonFixtures(
    teamId: number,
    beforeDate: string,
    season: number,
    options?: ProviderRequestOptions,
  ) {
    const { beforeTime, fromDate, toDate } = historyRange(beforeDate);
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
        cacheTtlMs: footballCacheTtl.teamSeasonFixtures,
        refresh: options?.refresh,
      },
    );
    return finishedBefore(fixtures, beforeTime);
  }

  async getTeamLastFixtures(
    teamId: number,
    beforeDate: string,
    season: number,
    limit: number,
    options?: ProviderRequestOptions,
  ) {
    const fixtures = await this.getTeamSeasonFixtures(
      teamId,
      beforeDate,
      season,
      options,
    );
    return fixtures.slice(0, Math.min(5, Math.max(1, limit)));
  }

  async getFixtureBundles(ids: number[], options?: ProviderRequestOptions) {
    const uniqueIds = [...new Set(ids.filter(Number.isInteger))].slice(0, 20);
    if (!uniqueIds.length) return [];
    return apiFootballRequest<ApiFootballFixture[]>(
      "/fixtures",
      { ids: uniqueIds.join("-"), timezone: "Europe/Warsaw" },
      {
        cacheTtlMs: footballCacheTtl.fixtureHistoryBundle,
        refresh: options?.refresh,
      },
    );
  }

  async getFixtureStatistics(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballTeamStatistics[]>(
      "/fixtures/statistics",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.fixtureStatistics, refresh: options?.refresh },
    );
  }

  async getFixtureEvents(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballEvent[]>(
      "/fixtures/events",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.fixtureEvents, refresh: options?.refresh },
    );
  }

  async getFixturePlayers(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballFixturePlayers[]>(
      "/fixtures/players",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.fixturePlayers, refresh: options?.refresh },
    );
  }

  async getFixtureLineups(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballLineup[]>(
      "/fixtures/lineups",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.fixtureLineups, refresh: options?.refresh },
    );
  }

  async getHeadToHead(
    homeTeamId: number,
    awayTeamId: number,
    options?: ProviderRequestOptions,
  ) {
    const fixtures = await apiFootballRequest<ApiFootballFixture[]>(
      "/fixtures/headtohead",
      { h2h: `${homeTeamId}-${awayTeamId}`, timezone: "Europe/Warsaw" },
      { cacheTtlMs: footballCacheTtl.headToHead, refresh: options?.refresh },
    );
    return finishedBefore(fixtures, Number.NaN).slice(0, 10);
  }

  async getStandings(
    leagueId: number,
    season: number,
    options?: ProviderRequestOptions,
  ) {
    return apiFootballRequest<ApiFootballStandingsResponse[]>(
      "/standings",
      { league: leagueId, season },
      { cacheTtlMs: footballCacheTtl.standings, refresh: options?.refresh },
    );
  }

  async getTeamStatistics(
    leagueId: number,
    season: number,
    teamId: number,
    beforeDate: string,
    options?: ProviderRequestOptions,
  ) {
    const beforeTime = new Date(beforeDate).getTime();
    const date = Number.isNaN(beforeTime)
      ? beforeDate.slice(0, 10)
      : new Date(beforeTime).toISOString().slice(0, 10);
    return apiFootballRequest<ApiFootballTeamSeasonStatistics>(
      "/teams/statistics",
      { league: leagueId, season, team: teamId, date },
      { cacheTtlMs: footballCacheTtl.teamStatistics, refresh: options?.refresh },
    );
  }

  async getInjuries(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballInjury[]>(
      "/injuries",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.injuries, refresh: options?.refresh },
    );
  }

  async getPredictions(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballPrediction[]>(
      "/predictions",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.predictions, refresh: options?.refresh },
    );
  }

  async getOdds(fixtureId: number, options?: ProviderRequestOptions) {
    return apiFootballRequest<ApiFootballOdds[]>(
      "/odds",
      { fixture: fixtureId },
      { cacheTtlMs: footballCacheTtl.odds, refresh: options?.refresh },
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
