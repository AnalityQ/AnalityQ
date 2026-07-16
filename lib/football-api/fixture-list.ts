import type { FootballFixtureSummary } from "./types";

const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const scheduledStatuses = new Set(["NS", "TBD"]);
const unavailableStatuses = new Set(["PST", "CANC", "ABD", "AWD", "WO"]);

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pl-PL")
    .trim();
}

function fixtureSearchText(fixture: FootballFixtureSummary) {
  return normalizeSearchValue([
    fixture.leagueName,
    fixture.leagueCountry,
    fixture.homeTeam.name,
    fixture.awayTeam.name,
    fixture.venue,
  ].filter(Boolean).join(" "));
}

function fixtureRank(fixture: FootballFixtureSummary, now: number) {
  if (liveStatuses.has(fixture.status)) return 0;
  if (unavailableStatuses.has(fixture.status)) return 4;

  const kickoff = new Date(fixture.kickoff).getTime();
  if (scheduledStatuses.has(fixture.status)) return 1;
  if (!Number.isNaN(kickoff) && kickoff >= now) return 2;
  return 3;
}

export function sortFixtureSummaries(
  fixtures: FootballFixtureSummary[],
  now = Date.now(),
) {
  return [...fixtures].sort((left, right) => {
    const rankDifference = fixtureRank(left, now) - fixtureRank(right, now);
    if (rankDifference !== 0) return rankDifference;

    const leftKickoff = new Date(left.kickoff).getTime();
    const rightKickoff = new Date(right.kickoff).getTime();
    if (Number.isNaN(leftKickoff) || Number.isNaN(rightKickoff)) return 0;
    return leftKickoff - rightKickoff;
  });
}

export function filterFixtureSummaries(
  fixtures: FootballFixtureSummary[],
  query: string,
) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return fixtures;
  return fixtures.filter((fixture) => fixtureSearchText(fixture).includes(normalizedQuery));
}
