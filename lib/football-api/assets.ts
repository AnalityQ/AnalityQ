import type { FootballAnalysisSnapshot } from "./types";

type LegacyImageCarrier = {
  logo?: unknown;
  teamLogo?: unknown;
  opponentLogo?: unknown;
  leagueLogo?: unknown;
  crest?: unknown;
  image?: unknown;
};

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0) || null;
}

export function normalizeApiAssetUrl(value?: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.startsWith("//media.api-sports.io/")) return `https:${normalized}`;
  if (normalized.startsWith("/football/") || normalized.startsWith("/flags/")) {
    return `https://media.api-sports.io${normalized}`;
  }
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" && url.hostname === "media.api-sports.io" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function legacyTeamLogo(team: LegacyImageCarrier | null | undefined, fallback?: unknown) {
  return normalizeApiAssetUrl(firstString(team?.logo, team?.teamLogo, team?.crest, team?.image, fallback));
}

export function legacyLeagueLogo(value: LegacyImageCarrier | string | null | undefined, fallback?: unknown) {
  const candidate = typeof value === "string"
    ? value
    : firstString(value?.leagueLogo, value?.logo, value?.crest, value?.image, fallback);
  return normalizeApiAssetUrl(candidate);
}

export function normalizeFootballSnapshotAssets(snapshot: FootballAnalysisSnapshot) {
  const raw = snapshot as FootballAnalysisSnapshot & Record<string, unknown>;
  const fixture = snapshot.fixture as typeof snapshot.fixture & LegacyImageCarrier & {
    homeLogo?: unknown;
    awayLogo?: unknown;
    competitionLogo?: unknown;
  };
  const homeTeam = fixture.homeTeam as typeof fixture.homeTeam & LegacyImageCarrier;
  const awayTeam = fixture.awayTeam as typeof fixture.awayTeam & LegacyImageCarrier;

  return {
    ...raw,
    fixture: {
      ...fixture,
      leagueLogo: legacyLeagueLogo(fixture, fixture.competitionLogo),
      leagueFlag: normalizeApiAssetUrl(fixture.leagueFlag),
      homeTeam: { ...homeTeam, logo: legacyTeamLogo(homeTeam, fixture.homeLogo) },
      awayTeam: { ...awayTeam, logo: legacyTeamLogo(awayTeam, fixture.awayLogo) },
    },
    recentForm: {
      home: normalizeRecentTeam(snapshot.recentForm.home),
      away: normalizeRecentTeam(snapshot.recentForm.away),
    },
    venueSplits: {
      homeTeamAtHome: normalizeRecentTeam(snapshot.venueSplits.homeTeamAtHome),
      awayTeamAway: normalizeRecentTeam(snapshot.venueSplits.awayTeamAway),
    },
    standings: snapshot.standings ? {
      ...snapshot.standings,
      leagueLogo: legacyLeagueLogo(snapshot.standings.leagueLogo),
      contextRows: snapshot.standings.contextRows.map((row) => ({
        ...row,
        teamLogo: legacyTeamLogo(row as typeof row & LegacyImageCarrier),
      })),
      home: snapshot.standings.home ? {
        ...snapshot.standings.home,
        teamLogo: legacyTeamLogo(snapshot.standings.home as typeof snapshot.standings.home & LegacyImageCarrier),
      } : null,
      away: snapshot.standings.away ? {
        ...snapshot.standings.away,
        teamLogo: legacyTeamLogo(snapshot.standings.away as typeof snapshot.standings.away & LegacyImageCarrier),
      } : null,
    } : null,
    h2h: snapshot.h2h ? {
      ...snapshot.h2h,
      matches: snapshot.h2h.matches.map((match) => ({
        ...match,
        homeTeam: { ...match.homeTeam, logo: legacyTeamLogo(match.homeTeam as typeof match.homeTeam & LegacyImageCarrier) },
        awayTeam: { ...match.awayTeam, logo: legacyTeamLogo(match.awayTeam as typeof match.awayTeam & LegacyImageCarrier) },
      })),
    } : null,
  } as FootballAnalysisSnapshot;
}

function normalizeRecentTeam(data: FootballAnalysisSnapshot["recentForm"]["home"]) {
  const team = data.team as typeof data.team & LegacyImageCarrier;
  return {
    ...data,
    team: { ...team, logo: legacyTeamLogo(team) },
    matches: data.matches.map((match) => {
      const legacy = match as typeof match & LegacyImageCarrier;
      return {
        ...match,
        teamLogo: legacyTeamLogo(legacy, legacy.logo),
        opponentLogo: normalizeApiAssetUrl(firstString(legacy.opponentLogo, legacy.crest, legacy.image)),
      };
    }),
  };
}
