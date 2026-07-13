import { aggregateLastMatches, aggregateWarnings } from "./aggregate";
import { normalizeFixtureStatistics, simplifyFixture } from "./normalize";
import { getFootballDataProvider } from "./provider";
import { FootballApiError, type FootballMatchImport, type NormalizedTeamMatchStats } from "./types";

async function normalizeTeamFixtures(
  fixtures: Awaited<ReturnType<ReturnType<typeof getFootballDataProvider>["getTeamLastFixtures"]>>,
  teamId: number,
  refresh: boolean,
) {
  const provider = getFootballDataProvider();
  const warnings: string[] = [];
  const normalized = await Promise.all(
    fixtures.map(async (fixture): Promise<NormalizedTeamMatchStats> => {
      try {
        const statistics = await provider.getFixtureStatistics(fixture.fixture.id, { refresh });
        if (!statistics.length) warnings.push(`Brak pełnych statystyk meczu z ${fixture.fixture.date.slice(0, 10)}.`);
        return normalizeFixtureStatistics(fixture, statistics, teamId);
      } catch (error) {
        if (error instanceof FootballApiError && error.code === "RATE_LIMIT") throw error;
        warnings.push(`Pobrano tylko część statystyk meczu z ${fixture.fixture.date.slice(0, 10)}.`);
        return normalizeFixtureStatistics(fixture, [], teamId);
      }
    }),
  );
  const withScores = normalized.filter((match) => match.goalsFor !== null && match.goalsAgainst !== null);
  if (withScores.length < normalized.length) {
    warnings.push("Pominięto zakończone spotkanie bez dostępnego wyniku bramkowego.");
  }
  return { normalized: withScores, warnings };
}

export async function buildFootballMatchImport(fixtureId: number, refresh = false): Promise<FootballMatchImport> {
  const provider = getFootballDataProvider();
  const fixture = await provider.getFixtureDetails(fixtureId, { refresh });
  if (!fixture) {
    throw new FootballApiError("INVALID_RESPONSE", "Nie znaleziono wybranego meczu.", 404);
  }

  const season = fixture.league.season;
  if (typeof season !== "number" || !Number.isInteger(season)) {
    throw new FootballApiError(
      "INVALID_RESPONSE",
      "Dostawca nie zwrócił sezonu wybranego meczu.",
      502,
    );
  }

  const kickoff = fixture.fixture.date;
  const [homeFixtures, awayFixtures] = await Promise.all([
    provider.getTeamLastFixtures(fixture.teams.home.id, kickoff, season, 5, { refresh }),
    provider.getTeamLastFixtures(fixture.teams.away.id, kickoff, season, 5, { refresh }),
  ]);
  const withoutSelected = (items: typeof homeFixtures) =>
    items.filter((item) => item.fixture.id !== fixtureId).slice(0, 5);

  const [homeData, awayData] = await Promise.all([
    normalizeTeamFixtures(withoutSelected(homeFixtures), fixture.teams.home.id, refresh),
    normalizeTeamFixtures(withoutSelected(awayFixtures), fixture.teams.away.id, refresh),
  ]);
  const homeAggregate = aggregateLastMatches(homeData.normalized);
  const awayAggregate = aggregateLastMatches(awayData.normalized);
  const warnings = [
    ...homeData.warnings,
    ...awayData.warnings,
    ...aggregateWarnings(homeAggregate, `gospodarzy (${fixture.teams.home.name})`),
    ...aggregateWarnings(awayAggregate, `gości (${fixture.teams.away.name})`),
  ];

  const hasSparseStatistics = [homeAggregate, awayAggregate].some(
    (aggregate) => aggregate.coverage.shotsForLast5 === 0 || aggregate.coverage.cornersForLast5 === 0,
  );
  if (hasSparseStatistics) warnings.push("Dla tej ligi nie są dostępne pełne statystyki.");
  if (homeAggregate.coverage.xgForLast5 === 0 && awayAggregate.coverage.xgForLast5 === 0) {
    warnings.push("Nie udało się pobrać danych xG.");
  }

  if (!homeData.normalized.length || !awayData.normalized.length) {
    warnings.push("Pobrano tylko część statystyk. Sprawdź dane przed zapisaniem.");
  }

  return {
    fixture: simplifyFixture(fixture),
    home: { team: fixture.teams.home, matches: homeData.normalized, aggregate: homeAggregate },
    away: { team: fixture.teams.away, matches: awayData.normalized, aggregate: awayAggregate },
    fetchedAt: new Date().toISOString(),
    warnings: [...new Set(warnings)],
    cache: { refreshed: refresh },
  };
}

export async function buildTeamLastMatches(
  teamId: number,
  beforeDate: string,
  season: number,
  limit = 5,
  refresh = false,
) {
  const provider = getFootballDataProvider();
  const fixtures = await provider.getTeamLastFixtures(teamId, beforeDate, season, limit, { refresh });
  const data = await normalizeTeamFixtures(fixtures, teamId, refresh);
  const aggregate = aggregateLastMatches(data.normalized);
  return {
    matches: data.normalized,
    aggregate,
    warnings: [...new Set([...data.warnings, ...aggregateWarnings(aggregate, "wybranej drużyny")])],
  };
}
