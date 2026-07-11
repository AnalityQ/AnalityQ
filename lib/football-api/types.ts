import type { NumericValue, TeamManualStats } from "../types";

export type FootballApiErrorCode =
  | "MISSING_KEY"
  | "INVALID_KEY"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "PROVIDER_ERROR"
  | "INVALID_RESPONSE";

export class FootballApiError extends Error {
  constructor(
    public readonly code: FootballApiErrorCode,
    message: string,
    public readonly status = 502,
  ) {
    super(message);
    this.name = "FootballApiError";
  }
}

export type ApiFootballEnvelope<T> = {
  get?: string;
  parameters?: Record<string, string>;
  errors?: string[] | Record<string, string>;
  results?: number;
  paging?: { current: number; total: number };
  response?: T;
};

export type ApiFootballTeam = {
  id: number;
  name: string;
  logo?: string | null;
};

export type ApiFootballFixture = {
  fixture: {
    id: number;
    date: string;
    timestamp?: number;
    status: { long?: string; short: string; elapsed?: number | null };
    venue?: { id?: number | null; name?: string | null; city?: string | null } | null;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string | null;
    season?: number;
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type ApiFootballStatistic = {
  type: string;
  value: number | string | null;
};

export type ApiFootballTeamStatistics = {
  team: ApiFootballTeam;
  statistics?: ApiFootballStatistic[] | null;
};

export type ApiFootballTeamSearchItem = {
  team: ApiFootballTeam & { country?: string | null; code?: string | null };
  venue?: { name?: string | null; city?: string | null } | null;
};

export type FootballFixtureSummary = {
  id: number;
  leagueId: number;
  leagueName: string;
  leagueCountry: string;
  leagueLogo?: string;
  kickoff: string;
  status: string;
  venue?: string;
  homeTeam: ApiFootballTeam;
  awayTeam: ApiFootballTeam;
};

export type FootballTeamSearchResult = {
  id: number;
  name: string;
  country?: string;
  logo?: string;
  venue?: string;
};

export type NormalizedTeamMatchStats = {
  fixtureId: number;
  date: string;
  opponentName: string;
  isHome: boolean;
  goalsFor: NumericValue;
  goalsAgainst: NumericValue;
  shotsFor: NumericValue;
  shotsAgainst: NumericValue;
  shotsOnTargetFor: NumericValue;
  shotsOnTargetAgainst: NumericValue;
  cornersFor: NumericValue;
  cornersAgainst: NumericValue;
  yellowCardsFor: NumericValue;
  yellowCardsAgainst: NumericValue;
  redCardsFor: NumericValue;
  redCardsAgainst: NumericValue;
  xgFor: NumericValue;
  xgAgainst: NumericValue;
  possessionFor: NumericValue;
  possessionAgainst: NumericValue;
  foulsFor: NumericValue;
  foulsAgainst: NumericValue;
  offsidesFor: NumericValue;
  offsidesAgainst: NumericValue;
  result: "W" | "D" | "L";
};

export type AggregateCoverageKey = Exclude<keyof TeamManualStats, "formLast5">;

export type AggregatedLastMatches = TeamManualStats & {
  matchesCount: number;
  coverage: Record<AggregateCoverageKey, number>;
  averages: Record<AggregateCoverageKey, NumericValue>;
};

export type FootballImportTeamData = {
  team: ApiFootballTeam;
  matches: NormalizedTeamMatchStats[];
  aggregate: AggregatedLastMatches;
};

export type FootballMatchImport = {
  fixture: FootballFixtureSummary;
  home: FootballImportTeamData;
  away: FootballImportTeamData;
  fetchedAt: string;
  warnings: string[];
  cache: { refreshed: boolean };
};

export type ProviderRequestOptions = {
  refresh?: boolean;
};

export interface FootballDataProvider {
  getFixturesByDate(date: string, options?: ProviderRequestOptions): Promise<ApiFootballFixture[]>;
  searchTeams(query: string, options?: ProviderRequestOptions): Promise<ApiFootballTeamSearchItem[]>;
  getTeamLastFixtures(
    teamId: number,
    beforeDate: string,
    limit: number,
    options?: ProviderRequestOptions,
  ): Promise<ApiFootballFixture[]>;
  getFixtureStatistics(
    fixtureId: number,
    options?: ProviderRequestOptions,
  ): Promise<ApiFootballTeamStatistics[]>;
  getFixtureDetails(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballFixture | null>;
}
