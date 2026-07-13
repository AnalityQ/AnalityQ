import { aggregateLastMatches, aggregateWarnings } from "./aggregate";
import { getCacheStatus } from "./cache";
import { normalizeFixtureStatistics, simplifyFixture } from "./normalize";
import { getFootballDataProvider } from "./provider";
import {
  buildMatchFixtureData,
  createTeamRecentData,
  generateAutomaticSummary,
  generateMatchRisks,
  generateMatchSignals,
  normalizeH2H,
  normalizeInjuries,
  normalizeLineups,
  normalizeOdds,
  normalizePlayerInsights,
  normalizePrediction,
  normalizeStandings,
} from "./snapshot";
import {
  FootballApiError,
  type ApiFootballFixture,
  type ApiFootballInjury,
  type ApiFootballOdds,
  type ApiFootballPrediction,
  type ApiFootballStandingsResponse,
  type ApiFootballTeamSeasonStatistics,
  type FootballAnalysisSnapshot,
  type FootballImportRequestSummary,
  type FootballMatchImport,
  type NormalizedTeamMatchStats,
  type SectionCoverage,
  type SectionStatus,
} from "./types";

const concurrencyLimit = 4;

type OptionalKey =
  | "standings"
  | "homeTeamStatistics"
  | "awayTeamStatistics"
  | "injuries"
  | "h2h"
  | "predictions"
  | "odds";

type OptionalResults = Partial<Record<OptionalKey, unknown>>;

async function settleInBatches(
  tasks: Array<{ key: OptionalKey; run: () => Promise<unknown> }>,
  limit = concurrencyLimit,
) {
  const values: OptionalResults = {};
  const errors = new Map<OptionalKey, unknown>();
  for (let index = 0; index < tasks.length; index += limit) {
    const batch = tasks.slice(index, index + limit);
    const settled = await Promise.allSettled(batch.map((task) => task.run()));
    settled.forEach((result, resultIndex) => {
      const key = batch[resultIndex].key;
      if (result.status === "fulfilled") values[key] = result.value;
      else errors.set(key, result.reason);
    });
  }
  return { values, errors };
}

function statusFor(value: unknown, failed: boolean): SectionStatus {
  if (failed) return "error";
  if (Array.isArray(value)) return value.length ? "complete" : "unavailable";
  return value ? "complete" : "unavailable";
}

function errorWarning(section: string, error: unknown) {
  if (error instanceof FootballApiError) {
    return `${section}: ${error.message}`;
  }
  return `${section}: dostawca nie zwrócił danych.`;
}

function uniqueFixtures(fixtures: ApiFootballFixture[]) {
  const map = new Map<number, ApiFootballFixture>();
  fixtures.forEach((fixture) => map.set(fixture.fixture.id, fixture));
  return [...map.values()];
}

function selectWithoutFixture(
  fixtures: ApiFootballFixture[],
  fixtureId: number,
  predicate?: (fixture: ApiFootballFixture) => boolean,
) {
  return fixtures
    .filter((fixture) => fixture.fixture.id !== fixtureId && (!predicate || predicate(fixture)))
    .slice(0, 5);
}

function normalizeFixtures(
  fixtures: ApiFootballFixture[],
  teamId: number,
  bundleMap: Map<number, ApiFootballFixture>,
) {
  const warnings: string[] = [];
  const normalized = fixtures
    .filter((fixture) => {
      const available = fixture.goals.home !== null && fixture.goals.away !== null;
      if (!available) {
        warnings.push(`Pominięto zakończone spotkanie ${fixture.fixture.id} bez wyniku bramkowego.`);
      }
      return available;
    })
    .map((fixture): NormalizedTeamMatchStats => {
      const detailed = bundleMap.get(fixture.fixture.id) || fixture;
      if (!detailed.statistics?.length) {
        warnings.push(`Brak pełnych statystyk meczu z ${fixture.fixture.date.slice(0, 10)}.`);
      }
      return normalizeFixtureStatistics(detailed, detailed.statistics || [], teamId);
    });
  return { normalized, warnings };
}

function endpoint(
  endpointName: string,
  status: SectionStatus,
  requests: number,
  message: string,
) {
  return { endpoint: endpointName, status, requests, message };
}

function buildCoverage(input: {
  fixture: ApiFootballFixture;
  homeOverall: number;
  awayOverall: number;
  homeVenue: number;
  awayVenue: number;
  standingsStatus: SectionStatus;
  teamStatisticsStatus: SectionStatus;
  h2hStatus: SectionStatus;
  injuriesStatus: SectionStatus;
  lineupsStatus: SectionStatus;
  playersStatus: SectionStatus;
  eventSamples: number;
  predictionsStatus: SectionStatus;
  oddsStatus: SectionStatus;
}): SectionCoverage {
  const recentSamples = input.homeOverall + input.awayOverall;
  const venueSamples = input.homeVenue + input.awayVenue;
  return {
    fixture: { status: "complete", samples: 1, message: "Pobrano szczegóły wybranego meczu." },
    recentForm: {
      status: recentSamples >= 10 ? "complete" : recentSamples ? "partial" : "unavailable",
      samples: recentSamples,
      message: `${input.homeOverall} meczów gospodarzy i ${input.awayOverall} meczów gości.`,
    },
    venueSplits: {
      status: venueSamples >= 6 ? "complete" : venueSamples ? "partial" : "unavailable",
      samples: venueSamples,
      message: `${input.homeVenue} meczów gospodarzy u siebie i ${input.awayVenue} gości na wyjeździe.`,
    },
    standings: { status: input.standingsStatus, samples: input.standingsStatus === "complete" ? 2 : 0, message: "Tabela ligi i kontekst pozycji." },
    teamStatistics: { status: input.teamStatisticsStatus, samples: input.teamStatisticsStatus === "complete" ? 2 : 0, message: "Statystyki sezonowe obu drużyn." },
    h2h: { status: input.h2hStatus, samples: 0, message: "Bezpośrednie spotkania obu drużyn." },
    injuries: { status: input.injuriesStatus, samples: 0, message: "Kontuzje, zawieszenia i gracze wątpliwi." },
    lineups: { status: input.lineupsStatus, samples: input.fixture.lineups?.length || 0, message: "Oficjalne składy wybranego meczu lub wzorzec historyczny." },
    players: { status: input.playersStatus, samples: 0, message: "Statystyki zawodników z ostatnich spotkań." },
    events: { status: input.eventSamples ? "complete" : "unavailable", samples: input.eventSamples, message: "Zdarzenia bramkowe i kartkowe z historii." },
    predictions: { status: input.predictionsStatus, samples: input.predictionsStatus === "complete" ? 1 : 0, message: "Prognoza dostawcy jest kontekstem pomocniczym." },
    odds: { status: input.oddsStatus, samples: input.oddsStatus === "complete" ? 1 : 0, message: "Kursy dostawcy nie nadpisują kursów wpisanych ręcznie." },
  };
}

export async function buildFootballMatchImport(
  fixtureId: number,
  refresh = false,
): Promise<FootballMatchImport> {
  const provider = getFootballDataProvider();
  const fixture = await provider.getFixtureDetails(fixtureId, { refresh });
  if (!fixture) {
    throw new FootballApiError("INVALID_RESPONSE", "Nie znaleziono wybranego meczu.", 404);
  }
  const seasonValue = fixture.league.season;
  if (typeof seasonValue !== "number" || !Number.isInteger(seasonValue)) {
    throw new FootballApiError(
      "INVALID_RESPONSE",
      "Dostawca nie zwrócił sezonu wybranego meczu.",
      502,
    );
  }
  const season: number = seasonValue;
  const kickoff = fixture.fixture.date;
  const [homeSeasonFixtures, awaySeasonFixtures] = await Promise.all([
    provider.getTeamSeasonFixtures(fixture.teams.home.id, kickoff, season, { refresh }),
    provider.getTeamSeasonFixtures(fixture.teams.away.id, kickoff, season, { refresh }),
  ]);
  const homeOverallRaw = selectWithoutFixture(homeSeasonFixtures, fixtureId);
  const awayOverallRaw = selectWithoutFixture(awaySeasonFixtures, fixtureId);
  const homeVenueRaw = selectWithoutFixture(
    homeSeasonFixtures,
    fixtureId,
    (item) => item.teams.home.id === fixture.teams.home.id,
  );
  const awayVenueRaw = selectWithoutFixture(
    awaySeasonFixtures,
    fixtureId,
    (item) => item.teams.away.id === fixture.teams.away.id,
  );
  const historyRaw = uniqueFixtures([
    ...homeOverallRaw,
    ...awayOverallRaw,
    ...homeVenueRaw,
    ...awayVenueRaw,
  ]).slice(0, 20);
  let historyBundles: ApiFootballFixture[] = [];
  const warnings: string[] = [];
  if (historyRaw.length) {
    try {
      historyBundles = await provider.getFixtureBundles(
        historyRaw.map((item) => item.fixture.id),
        { refresh },
      );
    } catch (error) {
      if (error instanceof FootballApiError && error.code === "RATE_LIMIT") throw error;
      warnings.push(errorWarning("Szczegółowe statystyki ostatnich spotkań", error));
    }
  }
  const bundleMap = new Map(historyBundles.map((item) => [item.fixture.id, item]));
  const homeOverallNormalized = normalizeFixtures(
    homeOverallRaw,
    fixture.teams.home.id,
    bundleMap,
  );
  const awayOverallNormalized = normalizeFixtures(
    awayOverallRaw,
    fixture.teams.away.id,
    bundleMap,
  );
  const homeVenueNormalized = normalizeFixtures(
    homeVenueRaw,
    fixture.teams.home.id,
    bundleMap,
  );
  const awayVenueNormalized = normalizeFixtures(
    awayVenueRaw,
    fixture.teams.away.id,
    bundleMap,
  );
  warnings.push(
    ...homeOverallNormalized.warnings,
    ...awayOverallNormalized.warnings,
    ...homeVenueNormalized.warnings,
    ...awayVenueNormalized.warnings,
  );

  const optionalTasks: Array<{ key: OptionalKey; run: () => Promise<unknown> }> = [
    { key: "standings", run: () => provider.getStandings(fixture.league.id, season, { refresh }) },
    { key: "homeTeamStatistics", run: () => provider.getTeamStatistics(fixture.league.id, season, fixture.teams.home.id, kickoff, { refresh }) },
    { key: "awayTeamStatistics", run: () => provider.getTeamStatistics(fixture.league.id, season, fixture.teams.away.id, kickoff, { refresh }) },
    { key: "injuries", run: () => provider.getInjuries(fixtureId, { refresh }) },
    { key: "h2h", run: () => provider.getHeadToHead(fixture.teams.home.id, fixture.teams.away.id, { refresh }) },
    { key: "predictions", run: () => provider.getPredictions(fixtureId, { refresh }) },
    { key: "odds", run: () => provider.getOdds(fixtureId, { refresh }) },
  ];
  const optional = await settleInBatches(optionalTasks);
  optional.errors.forEach((error, key) => warnings.push(errorWarning(key, error)));

  const h2hRaw = (optional.values.h2h as ApiFootballFixture[] | undefined) || null;
  let h2hBundles: ApiFootballFixture[] = [];
  if (h2hRaw?.length) {
    try {
      h2hBundles = await provider.getFixtureBundles(
        h2hRaw.slice(0, 10).map((item) => item.fixture.id),
        { refresh },
      );
    } catch (error) {
      warnings.push(errorWarning("Szczegółowe statystyki H2H", error));
    }
  }

  const homeRecent = createTeamRecentData(fixture.teams.home, homeOverallNormalized.normalized);
  const awayRecent = createTeamRecentData(fixture.teams.away, awayOverallNormalized.normalized);
  const homeVenue = createTeamRecentData(fixture.teams.home, homeVenueNormalized.normalized);
  const awayVenue = createTeamRecentData(fixture.teams.away, awayVenueNormalized.normalized);
  const playerInsights = normalizePlayerInsights(
    historyBundles,
    fixture.teams.home.id,
    fixture.teams.away.id,
  );
  const lineups = normalizeLineups(
    fixture.lineups,
    fixture.players,
    historyBundles,
    fixture.teams.home.id,
    fixture.teams.away.id,
  );
  const injuries = normalizeInjuries(
    optional.errors.has("injuries")
      ? null
      : ((optional.values.injuries as ApiFootballInjury[] | undefined) || []),
    playerInsights,
  );
  const standings = normalizeStandings(
    optional.errors.has("standings")
      ? null
      : ((optional.values.standings as ApiFootballStandingsResponse[] | undefined) || []),
    fixture,
  );
  const h2h = normalizeH2H(
    optional.errors.has("h2h") ? null : h2hRaw,
    h2hBundles,
    season,
    fixture.teams.home.id,
    fixture.teams.away.id,
  );
  const predictions = normalizePrediction(
    optional.errors.has("predictions")
      ? null
      : ((optional.values.predictions as ApiFootballPrediction[] | undefined) || []),
  );
  const providerOdds = normalizeOdds(
    optional.errors.has("odds")
      ? null
      : ((optional.values.odds as ApiFootballOdds[] | undefined) || []),
  );
  const signals = generateMatchSignals({
    homeName: fixture.teams.home.name,
    awayName: fixture.teams.away.name,
    homeOverall: homeRecent,
    awayOverall: awayRecent,
    homeVenue,
    awayVenue,
    standings,
    h2h,
    injuries,
  });
  const risks = generateMatchRisks({
    homeName: fixture.teams.home.name,
    awayName: fixture.teams.away.name,
    homeOverall: homeRecent,
    awayOverall: awayRecent,
    homeVenue,
    awayVenue,
    injuries,
    lineups,
  });
  const automaticSummary = generateAutomaticSummary({
    homeName: fixture.teams.home.name,
    awayName: fixture.teams.away.name,
    standings,
    homeVenue,
    awayVenue,
    signals,
    risks,
    injuries,
  });
  const standingsStatus = standings.available
    ? "complete"
    : optional.errors.has("standings") ? "error" : "unavailable";
  const teamStatisticsStatus = optional.errors.has("homeTeamStatistics") || optional.errors.has("awayTeamStatistics")
    ? optional.values.homeTeamStatistics || optional.values.awayTeamStatistics ? "partial" : "error"
    : optional.values.homeTeamStatistics && optional.values.awayTeamStatistics ? "complete" : "unavailable";
  const coverage = buildCoverage({
    fixture,
    homeOverall: homeRecent.summary.sampleSize,
    awayOverall: awayRecent.summary.sampleSize,
    homeVenue: homeVenue.summary.sampleSize,
    awayVenue: awayVenue.summary.sampleSize,
    standingsStatus,
    teamStatisticsStatus,
    h2hStatus: h2h.status,
    injuriesStatus: injuries.status,
    lineupsStatus: lineups.status,
    playersStatus: playerInsights.status,
    eventSamples: historyBundles.filter((item) => item.events?.length).length,
    predictionsStatus: statusFor(optional.values.predictions, optional.errors.has("predictions")),
    oddsStatus: statusFor(optional.values.odds, optional.errors.has("odds")),
  });
  coverage.h2h.samples = h2h.matches.length;
  coverage.injuries.samples = injuries.missing.length + injuries.questionable.length;
  coverage.players.samples = playerInsights.home.length + playerInsights.away.length;

  const endpoints = [
    endpoint("/fixtures?id", "complete", 1, "Szczegóły meczu wraz z osadzonymi zdarzeniami, składami, statystykami i zawodnikami."),
    endpoint("/fixtures (historia sezonu)", "complete", 2, "Po jednym zestawie sezonowym na drużynę; podziały wykonano lokalnie."),
    endpoint("/fixtures?ids", historyBundles.length ? "complete" : historyRaw.length ? "partial" : "unavailable", historyRaw.length ? 1 : 0, "Pakiet szczegółów z deduplikacją fixture ID."),
    endpoint("/fixtures/statistics", historyBundles.length ? "complete" : "unavailable", 0, "Statystyki osadzono w pakiecie /fixtures?ids; dedykowany endpoint pozostaje fallbackiem."),
    endpoint("/fixtures/events", coverage.events.status, 0, "Zdarzenia osadzono w pakiecie /fixtures?ids."),
    endpoint("/fixtures/players", playerInsights.status, 0, "Dane zawodników osadzono w pakiecie /fixtures?ids."),
    endpoint("/fixtures/lineups", lineups.status, 0, "Składy osadzono w odpowiedzi /fixtures?id oraz historii."),
    endpoint("/standings", standingsStatus, 1, standings.reason || "Tabela pobrana."),
    endpoint("/teams/statistics", teamStatisticsStatus, 2, "Po jednym zapytaniu dla każdej drużyny."),
    endpoint("/fixtures/headtohead", h2h.status, 1, h2h.reason || "H2H pobrane."),
    endpoint("/injuries", injuries.status, 1, injuries.reason || "Absencje pobrane."),
    endpoint("/predictions", coverage.predictions.status, 1, predictions ? "Prognoza pobrana." : "Brak prognozy dostawcy."),
    endpoint("/odds", coverage.odds.status, 1, providerOdds ? "Kursy pobrane jako źródło opcjonalne; nie nadpisują wartości ręcznych." : "Brak kursów dostawcy."),
  ];
  if (h2hRaw?.length) {
    endpoints.push(endpoint("/fixtures?ids (H2H)", h2hBundles.length ? "complete" : "partial", 1, "Szczegółowe statystyki bezpośrednich meczów."));
  }
  const requestSummary: FootballImportRequestSummary = {
    totalRequests: endpoints.reduce((sum, item) => sum + item.requests, 0),
    cacheStrategy: "Historyczne pakiety mają długi cache; tabela 1 h; absencje 45 min; składy i kursy krótki cache.",
    concurrencyLimit,
    endpoints,
  };

  const homeAggregate = aggregateLastMatches(homeRecent.matches);
  const awayAggregate = aggregateLastMatches(awayRecent.matches);
  warnings.push(
    ...aggregateWarnings(homeAggregate, `drużyny ${fixture.teams.home.name}`),
    ...aggregateWarnings(awayAggregate, `drużyny ${fixture.teams.away.name}`),
  );
  if (homeVenue.summary.sampleSize < 3 || awayVenue.summary.sampleSize < 3) {
    warnings.push("Co najmniej jeden podział dom/wyjazd obejmuje mniej niż 3 spotkania.");
  }
  if (!lineups.official) warnings.push(lineups.reason || "Oficjalne składy nie są jeszcze dostępne.");
  if (injuries.reason) warnings.push(injuries.reason);
  const cache = getCacheStatus();
  if (cache.warning) warnings.push(cache.warning);
  const fetchedAt = new Date().toISOString();
  const snapshot: FootballAnalysisSnapshot = {
    version: 2,
    fixture: buildMatchFixtureData(fixture),
    standings,
    recentForm: { home: homeRecent, away: awayRecent },
    venueSplits: { homeTeamAtHome: homeVenue, awayTeamAway: awayVenue },
    h2h,
    injuries,
    lineups,
    playerInsights,
    predictions,
    odds: providerOdds,
    signals,
    risks,
    automaticSummary,
    coverage,
    warnings: [...new Set(warnings)],
    requestSummary,
    fetchedAt,
  };

  return {
    fixture: simplifyFixture(fixture),
    home: { team: fixture.teams.home, matches: homeRecent.matches, aggregate: homeAggregate },
    away: { team: fixture.teams.away, matches: awayRecent.matches, aggregate: awayAggregate },
    snapshot,
    fetchedAt,
    warnings: snapshot.warnings,
    cache: { refreshed: refresh, persistent: cache.persistent, warning: cache.warning },
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
  const fixtures = await provider.getTeamLastFixtures(
    teamId,
    beforeDate,
    season,
    limit,
    { refresh },
  );
  let bundles: ApiFootballFixture[] = [];
  try {
    bundles = await provider.getFixtureBundles(
      fixtures.map((fixture) => fixture.fixture.id),
      { refresh },
    );
  } catch {
    // Samodzielny endpoint nadal zwraca wyniki i oznacza brak statystyk w ostrzeżeniach.
  }
  const data = normalizeFixtures(
    fixtures,
    teamId,
    new Map(bundles.map((fixture) => [fixture.fixture.id, fixture])),
  );
  const aggregate = aggregateLastMatches(data.normalized);
  return {
    matches: data.normalized,
    aggregate,
    warnings: [...new Set([...data.warnings, ...aggregateWarnings(aggregate, "wybranej drużyny")])],
  };
}

export type FootballOptionalTeamStatistics = ApiFootballTeamSeasonStatistics;
