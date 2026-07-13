import { safeNumber } from "../calculations";
import type { NumericValue } from "../types";
import type {
  ApiFootballEvent,
  ApiFootballFixture,
  ApiFootballStatistic,
  ApiFootballTeamSearchItem,
  ApiFootballTeamStatistics,
  FootballFixtureSummary,
  FootballTeamSearchResult,
  NormalizedAdditionalStatistic,
  NormalizedTeamMatchStats,
} from "./types";

function canonical(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const knownStatistics = new Set(
  [
    "Total Shots",
    "Shots Total",
    "Shots on Goal",
    "Shots on Target",
    "Shots off Goal",
    "Blocked Shots",
    "Shots insidebox",
    "Shots outsidebox",
    "Corner Kicks",
    "Corners",
    "Yellow Cards",
    "Yellow Card",
    "Red Cards",
    "Red Card",
    "Ball Possession",
    "Possession",
    "expected_goals",
    "Expected Goals",
    "Expected Goal",
    "xG",
    "Fouls",
    "Fouls Committed",
    "Offsides",
    "Offside",
    "Goalkeeper Saves",
    "Total passes",
    "Passes accurate",
    "Passes %",
  ].map(canonical),
);

export function normalizedStatisticValue(value: number | string | null | undefined): NumericValue {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return safeNumber(value.replace("%", "").trim());
  return safeNumber(value);
}

function numericStatistic(
  statistics: ApiFootballStatistic[] | null | undefined,
  aliases: string[],
): NumericValue {
  const accepted = new Set(aliases.map(canonical));
  const statistic = statistics?.find((item) => accepted.has(canonical(item.type || "")));
  return normalizedStatisticValue(statistic?.value);
}

function additionalStatistics(
  statistics: ApiFootballStatistic[] | null | undefined,
): NormalizedAdditionalStatistic[] {
  return (statistics || [])
    .filter((item) => !knownStatistics.has(canonical(item.type || "")))
    .map((item) => ({
      key: canonical(item.type || "pozostala-statystyka"),
      label: item.type || "Pozostała statystyka",
      value: normalizedStatisticValue(item.value),
      rawValue: item.value,
    }));
}

function venueLabel(fixture: ApiFootballFixture) {
  return [fixture.fixture.venue?.name, fixture.fixture.venue?.city]
    .filter(Boolean)
    .join(", ") || undefined;
}

export function countryCodeFromFlag(flag?: string | null) {
  if (!flag) return undefined;
  const match = flag.match(/\/flags\/([a-z-]+)\.(?:svg|png)(?:\?|$)/i);
  return match?.[1]?.toUpperCase();
}

export function simplifyFixture(fixture: ApiFootballFixture): FootballFixtureSummary {
  return {
    id: fixture.fixture.id,
    leagueId: fixture.league.id,
    leagueName: fixture.league.name,
    leagueCountry: fixture.league.country,
    leagueLogo: fixture.league.logo || undefined,
    leagueFlag: fixture.league.flag || undefined,
    countryCode: countryCodeFromFlag(fixture.league.flag),
    season: fixture.league.season,
    round: fixture.league.round || undefined,
    referee: fixture.fixture.referee || undefined,
    kickoff: fixture.fixture.date,
    timestamp: fixture.fixture.timestamp,
    status: fixture.fixture.status.short,
    statusLong: fixture.fixture.status.long,
    venue: venueLabel(fixture),
    venueCity: fixture.fixture.venue?.city || undefined,
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

function combinedCards(yellow: NumericValue, red: NumericValue): NumericValue {
  if (yellow === null || red === null) return null;
  return yellow + red;
}

function sideScore(
  score: { home: number | null; away: number | null } | null | undefined,
  isHome: boolean,
) {
  return safeNumber(isHome ? score?.home : score?.away);
}

function difference(fulltime: NumericValue, halftime: NumericValue): NumericValue {
  if (fulltime === null || halftime === null) return null;
  return fulltime - halftime;
}

function cardHalf(
  events: ApiFootballEvent[] | null | undefined,
  teamId: number,
  half: 1 | 2,
) {
  if (!events) return null;
  return events.filter((event) => {
    const elapsed = event.time?.elapsed;
    return (
      event.type?.toLowerCase() === "card" &&
      event.team?.id === teamId &&
      typeof elapsed === "number" &&
      (half === 1 ? elapsed <= 45 : elapsed > 45)
    );
  }).length;
}

function firstGoal(
  events: ApiFootballEvent[] | null | undefined,
  teamId: number,
  goalsFor: NumericValue,
  goalsAgainst: NumericValue,
): NormalizedTeamMatchStats["firstGoal"] {
  const goals = (events || [])
    .filter(
      (event) =>
        event.type?.toLowerCase() === "goal" &&
        !event.detail?.toLowerCase().includes("missed"),
    )
    .sort(
      (a, b) =>
        (a.time?.elapsed || 0) * 100 + (a.time?.extra || 0) -
        ((b.time?.elapsed || 0) * 100 + (b.time?.extra || 0)),
    );
  if (goals[0]?.team?.id) return goals[0].team?.id === teamId ? "scored" : "conceded";
  if (goalsFor === 0 && goalsAgainst === 0) return "none";
  return null;
}

export function normalizeFixtureStatistics(
  rawFixture: ApiFootballFixture,
  rawStatistics: ApiFootballTeamStatistics[] | null | undefined,
  teamId: number,
): NormalizedTeamMatchStats {
  const isHome = rawFixture.teams.home.id === teamId;
  const team = isHome ? rawFixture.teams.home : rawFixture.teams.away;
  const opponent = isHome ? rawFixture.teams.away : rawFixture.teams.home;
  const teamStatistics = rawStatistics?.find((entry) => entry.team.id === teamId)?.statistics;
  const opponentStatistics = rawStatistics?.find((entry) => entry.team.id === opponent.id)?.statistics;
  const read = (stats: ApiFootballStatistic[] | null | undefined, aliases: string[]) =>
    numericStatistic(stats, aliases);

  const yellowCardsFor = read(teamStatistics, ["Yellow Cards", "Yellow Card"]);
  const yellowCardsAgainst = read(opponentStatistics, ["Yellow Cards", "Yellow Card"]);
  const redCardsFor = read(teamStatistics, ["Red Cards", "Red Card"]);
  const redCardsAgainst = read(opponentStatistics, ["Red Cards", "Red Card"]);
  const goalsFor = isHome ? safeNumber(rawFixture.goals.home) : safeNumber(rawFixture.goals.away);
  const goalsAgainst = isHome ? safeNumber(rawFixture.goals.away) : safeNumber(rawFixture.goals.home);
  const halftimeGoalsFor = sideScore(rawFixture.score?.halftime, isHome);
  const halftimeGoalsAgainst = sideScore(rawFixture.score?.halftime, !isHome);
  const fulltimeGoalsFor = sideScore(rawFixture.score?.fulltime, isHome) ?? goalsFor;
  const fulltimeGoalsAgainst = sideScore(rawFixture.score?.fulltime, !isHome) ?? goalsAgainst;

  return {
    fixtureId: rawFixture.fixture.id,
    date: rawFixture.fixture.date,
    leagueName: rawFixture.league.name || null,
    opponentName: opponent.name,
    opponentLogo: opponent.logo || null,
    teamLogo: team.logo || null,
    isHome,
    status: rawFixture.fixture.status.short,
    goalsFor,
    goalsAgainst,
    halftimeGoalsFor,
    halftimeGoalsAgainst,
    secondHalfGoalsFor: difference(fulltimeGoalsFor, halftimeGoalsFor),
    secondHalfGoalsAgainst: difference(fulltimeGoalsAgainst, halftimeGoalsAgainst),
    shotsFor: read(teamStatistics, ["Total Shots", "Shots Total"]),
    shotsAgainst: read(opponentStatistics, ["Total Shots", "Shots Total"]),
    shotsOnTargetFor: read(teamStatistics, ["Shots on Goal", "Shots on Target"]),
    shotsOnTargetAgainst: read(opponentStatistics, ["Shots on Goal", "Shots on Target"]),
    shotsOffTargetFor: read(teamStatistics, ["Shots off Goal"]),
    shotsOffTargetAgainst: read(opponentStatistics, ["Shots off Goal"]),
    blockedShotsFor: read(teamStatistics, ["Blocked Shots"]),
    blockedShotsAgainst: read(opponentStatistics, ["Blocked Shots"]),
    shotsInsideBoxFor: read(teamStatistics, ["Shots insidebox"]),
    shotsInsideBoxAgainst: read(opponentStatistics, ["Shots insidebox"]),
    shotsOutsideBoxFor: read(teamStatistics, ["Shots outsidebox"]),
    shotsOutsideBoxAgainst: read(opponentStatistics, ["Shots outsidebox"]),
    cornersFor: read(teamStatistics, ["Corner Kicks", "Corners"]),
    cornersAgainst: read(opponentStatistics, ["Corner Kicks", "Corners"]),
    yellowCardsFor,
    yellowCardsAgainst,
    redCardsFor,
    redCardsAgainst,
    cardsFor: combinedCards(yellowCardsFor, redCardsFor),
    cardsAgainst: combinedCards(yellowCardsAgainst, redCardsAgainst),
    xgFor: read(teamStatistics, ["expected_goals", "Expected Goals", "Expected Goal", "xG"]),
    xgAgainst: read(opponentStatistics, ["expected_goals", "Expected Goals", "Expected Goal", "xG"]),
    possessionFor: read(teamStatistics, ["Ball Possession", "Possession"]),
    possessionAgainst: read(opponentStatistics, ["Ball Possession", "Possession"]),
    foulsFor: read(teamStatistics, ["Fouls", "Fouls Committed"]),
    foulsAgainst: read(opponentStatistics, ["Fouls", "Fouls Committed"]),
    offsidesFor: read(teamStatistics, ["Offsides", "Offside"]),
    offsidesAgainst: read(opponentStatistics, ["Offsides", "Offside"]),
    goalkeeperSavesFor: read(teamStatistics, ["Goalkeeper Saves"]),
    goalkeeperSavesAgainst: read(opponentStatistics, ["Goalkeeper Saves"]),
    totalPassesFor: read(teamStatistics, ["Total passes"]),
    totalPassesAgainst: read(opponentStatistics, ["Total passes"]),
    accuratePassesFor: read(teamStatistics, ["Passes accurate"]),
    accuratePassesAgainst: read(opponentStatistics, ["Passes accurate"]),
    passAccuracyFor: read(teamStatistics, ["Passes %"]),
    passAccuracyAgainst: read(opponentStatistics, ["Passes %"]),
    cardsFirstHalfFor: cardHalf(rawFixture.events, teamId, 1),
    cardsSecondHalfFor: cardHalf(rawFixture.events, teamId, 2),
    firstGoal: firstGoal(rawFixture.events, teamId, goalsFor, goalsAgainst),
    additionalStatistics: {
      team: additionalStatistics(teamStatistics),
      opponent: additionalStatistics(opponentStatistics),
    },
    result: resultFor(rawFixture, teamId),
  };
}
