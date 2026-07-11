import { safeNumber } from "../calculations";
import type { NumericValue } from "../types";
import type {
  ApiFootballFixture,
  ApiFootballStatistic,
  ApiFootballTeamStatistics,
  FootballFixtureSummary,
  FootballTeamSearchResult,
  NormalizedTeamMatchStats,
  ApiFootballTeamSearchItem,
} from "./types";

function canonical(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function numericStatistic(statistics: ApiFootballStatistic[] | null | undefined, aliases: string[]): NumericValue {
  const accepted = new Set(aliases.map(canonical));
  const statistic = statistics?.find((item) => accepted.has(canonical(item.type || "")));
  if (!statistic || statistic.value === null || statistic.value === undefined) return null;
  if (typeof statistic.value === "string") {
    return safeNumber(statistic.value.replace("%", "").trim());
  }
  return safeNumber(statistic.value);
}

function venueLabel(fixture: ApiFootballFixture) {
  return [fixture.fixture.venue?.name, fixture.fixture.venue?.city].filter(Boolean).join(", ") || undefined;
}

export function simplifyFixture(fixture: ApiFootballFixture): FootballFixtureSummary {
  return {
    id: fixture.fixture.id,
    leagueId: fixture.league.id,
    leagueName: fixture.league.name,
    leagueCountry: fixture.league.country,
    leagueLogo: fixture.league.logo || undefined,
    kickoff: fixture.fixture.date,
    status: fixture.fixture.status.short,
    venue: venueLabel(fixture),
    homeTeam: { ...fixture.teams.home, logo: fixture.teams.home.logo || undefined },
    awayTeam: { ...fixture.teams.away, logo: fixture.teams.away.logo || undefined },
  };
}

export function simplifyTeam(item: ApiFootballTeamSearchItem): FootballTeamSearchResult {
  return {
    id: item.team.id,
    name: item.team.name,
    country: item.team.country || undefined,
    logo: item.team.logo || undefined,
    venue: [item.venue?.name, item.venue?.city].filter(Boolean).join(", ") || undefined,
  };
}

function resultFor(fixture: ApiFootballFixture, teamId: number): "W" | "D" | "L" {
  const isHome = fixture.teams.home.id === teamId;
  const own = isHome ? fixture.goals.home : fixture.goals.away;
  const against = isHome ? fixture.goals.away : fixture.goals.home;
  if (own !== null && against !== null) {
    if (own > against) return "W";
    if (own < against) return "L";
  }
  return "D";
}

export function normalizeFixtureStatistics(
  rawFixture: ApiFootballFixture,
  rawStatistics: ApiFootballTeamStatistics[] | null | undefined,
  teamId: number,
): NormalizedTeamMatchStats {
  const isHome = rawFixture.teams.home.id === teamId;
  const opponent = isHome ? rawFixture.teams.away : rawFixture.teams.home;
  const teamStatistics = rawStatistics?.find((entry) => entry.team.id === teamId)?.statistics;
  const opponentStatistics = rawStatistics?.find((entry) => entry.team.id === opponent.id)?.statistics;

  const read = (stats: ApiFootballStatistic[] | null | undefined, aliases: string[]) =>
    numericStatistic(stats, aliases);

  return {
    fixtureId: rawFixture.fixture.id,
    date: rawFixture.fixture.date,
    opponentName: opponent.name,
    isHome,
    goalsFor: isHome ? safeNumber(rawFixture.goals.home) : safeNumber(rawFixture.goals.away),
    goalsAgainst: isHome ? safeNumber(rawFixture.goals.away) : safeNumber(rawFixture.goals.home),
    shotsFor: read(teamStatistics, ["Total Shots", "Shots Total"]),
    shotsAgainst: read(opponentStatistics, ["Total Shots", "Shots Total"]),
    shotsOnTargetFor: read(teamStatistics, ["Shots on Goal", "Shots on Target"]),
    shotsOnTargetAgainst: read(opponentStatistics, ["Shots on Goal", "Shots on Target"]),
    cornersFor: read(teamStatistics, ["Corner Kicks", "Corners"]),
    cornersAgainst: read(opponentStatistics, ["Corner Kicks", "Corners"]),
    yellowCardsFor: read(teamStatistics, ["Yellow Cards", "Yellow Card"]),
    yellowCardsAgainst: read(opponentStatistics, ["Yellow Cards", "Yellow Card"]),
    redCardsFor: read(teamStatistics, ["Red Cards", "Red Card"]),
    redCardsAgainst: read(opponentStatistics, ["Red Cards", "Red Card"]),
    xgFor: read(teamStatistics, ["expected_goals", "Expected Goals", "Expected Goal", "xG"]),
    xgAgainst: read(opponentStatistics, ["expected_goals", "Expected Goals", "Expected Goal", "xG"]),
    possessionFor: read(teamStatistics, ["Ball Possession", "Possession"]),
    possessionAgainst: read(opponentStatistics, ["Ball Possession", "Possession"]),
    foulsFor: read(teamStatistics, ["Fouls", "Fouls Committed"]),
    foulsAgainst: read(opponentStatistics, ["Fouls", "Fouls Committed"]),
    offsidesFor: read(teamStatistics, ["Offsides", "Offside"]),
    offsidesAgainst: read(opponentStatistics, ["Offsides", "Offside"]),
    result: resultFor(rawFixture, teamId),
  };
}
