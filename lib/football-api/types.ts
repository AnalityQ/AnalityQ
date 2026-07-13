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
  country?: string | null;
  code?: string | null;
  national?: boolean | null;
  winner?: boolean | null;
};

export type ApiFootballStatistic = {
  type: string;
  value: number | string | null;
};

export type ApiFootballTeamStatistics = {
  team: ApiFootballTeam;
  statistics?: ApiFootballStatistic[] | null;
};

export type ApiFootballEvent = {
  time?: { elapsed?: number | null; extra?: number | null } | null;
  team?: ApiFootballTeam | null;
  player?: { id?: number | null; name?: string | null } | null;
  assist?: { id?: number | null; name?: string | null } | null;
  type?: string | null;
  detail?: string | null;
  comments?: string | null;
};

export type ApiFootballLineupPlayer = {
  player?: {
    id?: number | null;
    name?: string | null;
    number?: number | null;
    pos?: string | null;
    grid?: string | null;
  } | null;
};

export type ApiFootballLineup = {
  team: ApiFootballTeam & {
    colors?: Record<string, unknown> | null;
  };
  coach?: {
    id?: number | null;
    name?: string | null;
    photo?: string | null;
  } | null;
  formation?: string | null;
  startXI?: ApiFootballLineupPlayer[] | null;
  substitutes?: ApiFootballLineupPlayer[] | null;
};

export type ApiFootballPlayerFixtureStatistics = {
  games?: {
    minutes?: number | null;
    number?: number | null;
    position?: string | null;
    rating?: string | number | null;
    captain?: boolean | null;
    substitute?: boolean | null;
  } | null;
  offsides?: number | null;
  shots?: { total?: number | null; on?: number | null } | null;
  goals?: {
    total?: number | null;
    conceded?: number | null;
    assists?: number | null;
    saves?: number | null;
  } | null;
  passes?: { total?: number | null; key?: number | null; accuracy?: number | string | null } | null;
  tackles?: { total?: number | null; blocks?: number | null; interceptions?: number | null } | null;
  duels?: { total?: number | null; won?: number | null } | null;
  dribbles?: { attempts?: number | null; success?: number | null; past?: number | null } | null;
  fouls?: { drawn?: number | null; committed?: number | null } | null;
  cards?: { yellow?: number | null; red?: number | null } | null;
  penalty?: Record<string, number | null> | null;
};

export type ApiFootballFixturePlayer = {
  player: {
    id: number;
    name: string;
    photo?: string | null;
    nationality?: string | null;
  };
  statistics?: ApiFootballPlayerFixtureStatistics[] | null;
};

export type ApiFootballFixturePlayers = {
  team: ApiFootballTeam;
  players?: ApiFootballFixturePlayer[] | null;
};

export type ApiFootballScore = {
  home: number | null;
  away: number | null;
};

export type ApiFootballFixture = {
  fixture: {
    id: number;
    referee?: string | null;
    timezone?: string | null;
    date: string;
    timestamp?: number;
    periods?: { first?: number | null; second?: number | null } | null;
    status: {
      long?: string;
      short: string;
      elapsed?: number | null;
      extra?: number | null;
    };
    venue?: { id?: number | null; name?: string | null; city?: string | null } | null;
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string | null;
    flag?: string | null;
    season?: number;
    round?: string | null;
    standings?: boolean | null;
  };
  teams: {
    home: ApiFootballTeam;
    away: ApiFootballTeam;
  };
  goals: ApiFootballScore;
  score?: {
    halftime?: ApiFootballScore | null;
    fulltime?: ApiFootballScore | null;
    extratime?: ApiFootballScore | null;
    penalty?: ApiFootballScore | null;
  } | null;
  events?: ApiFootballEvent[] | null;
  lineups?: ApiFootballLineup[] | null;
  statistics?: ApiFootballTeamStatistics[] | null;
  players?: ApiFootballFixturePlayers[] | null;
};

export type ApiFootballTeamSearchItem = {
  team: ApiFootballTeam & { country?: string | null; code?: string | null };
  venue?: { name?: string | null; city?: string | null } | null;
};

export type ApiFootballStandingRow = {
  rank: number;
  team: ApiFootballTeam;
  points: number;
  goalsDiff: number;
  group?: string | null;
  form?: string | null;
  status?: string | null;
  description?: string | null;
  all: ApiFootballStandingRecord;
  home: ApiFootballStandingRecord;
  away: ApiFootballStandingRecord;
  update?: string | null;
};

export type ApiFootballStandingRecord = {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
};

export type ApiFootballStandingsResponse = {
  league: {
    id: number;
    name: string;
    country: string;
    logo?: string | null;
    flag?: string | null;
    season: number;
    standings?: ApiFootballStandingRow[][] | null;
  };
};

export type ApiFootballTeamSeasonStatistics = {
  league?: Record<string, unknown> | null;
  team?: ApiFootballTeam | null;
  form?: string | null;
  fixtures?: Record<string, unknown> | null;
  goals?: Record<string, unknown> | null;
  biggest?: Record<string, unknown> | null;
  clean_sheet?: Record<string, unknown> | null;
  failed_to_score?: Record<string, unknown> | null;
  penalty?: Record<string, unknown> | null;
  lineups?: Array<{ formation?: string | null; played?: number | null }> | null;
  cards?: Record<string, unknown> | null;
};

export type ApiFootballInjury = {
  player?: {
    id?: number | null;
    name?: string | null;
    photo?: string | null;
    type?: string | null;
    reason?: string | null;
  } | null;
  team?: ApiFootballTeam | null;
  fixture?: { id?: number | null; timezone?: string | null; date?: string | null; timestamp?: number | null } | null;
  league?: Record<string, unknown> | null;
};

export type ApiFootballPrediction = {
  predictions?: {
    winner?: { id?: number | null; name?: string | null; comment?: string | null } | null;
    win_or_draw?: boolean | null;
    under_over?: string | null;
    goals?: { home?: string | null; away?: string | null } | null;
    advice?: string | null;
    percent?: { home?: string | null; draw?: string | null; away?: string | null } | null;
  } | null;
  league?: Record<string, unknown> | null;
  teams?: Record<string, unknown> | null;
  comparison?: Record<string, unknown> | null;
  h2h?: ApiFootballFixture[] | null;
};

export type ApiFootballOdds = {
  league?: Record<string, unknown> | null;
  fixture?: { id?: number | null; timezone?: string | null; date?: string | null; timestamp?: number | null } | null;
  update?: string | null;
  bookmakers?: Array<{
    id?: number | null;
    name?: string | null;
    bets?: Array<{
      id?: number | null;
      name?: string | null;
      values?: Array<{ value?: string | null; odd?: string | number | null }> | null;
    }> | null;
  }> | null;
};

export type FootballFixtureSummary = {
  id: number;
  leagueId: number;
  leagueName: string;
  leagueCountry: string;
  leagueLogo?: string;
  leagueFlag?: string;
  countryCode?: string;
  season?: number;
  round?: string;
  referee?: string;
  kickoff: string;
  timestamp?: number;
  status: string;
  statusLong?: string;
  venue?: string;
  venueCity?: string;
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

export type NormalizedAdditionalStatistic = {
  key: string;
  label: string;
  value: NumericValue;
  rawValue: string | number | null;
};

export type NormalizedTeamMatchStats = {
  fixtureId: number;
  date: string;
  leagueName: string | null;
  opponentName: string;
  opponentLogo: string | null;
  teamLogo: string | null;
  isHome: boolean;
  status: string;
  goalsFor: NumericValue;
  goalsAgainst: NumericValue;
  halftimeGoalsFor: NumericValue;
  halftimeGoalsAgainst: NumericValue;
  secondHalfGoalsFor: NumericValue;
  secondHalfGoalsAgainst: NumericValue;
  shotsFor: NumericValue;
  shotsAgainst: NumericValue;
  shotsOnTargetFor: NumericValue;
  shotsOnTargetAgainst: NumericValue;
  shotsOffTargetFor: NumericValue;
  shotsOffTargetAgainst: NumericValue;
  blockedShotsFor: NumericValue;
  blockedShotsAgainst: NumericValue;
  shotsInsideBoxFor: NumericValue;
  shotsInsideBoxAgainst: NumericValue;
  shotsOutsideBoxFor: NumericValue;
  shotsOutsideBoxAgainst: NumericValue;
  cornersFor: NumericValue;
  cornersAgainst: NumericValue;
  yellowCardsFor: NumericValue;
  yellowCardsAgainst: NumericValue;
  redCardsFor: NumericValue;
  redCardsAgainst: NumericValue;
  cardsFor: NumericValue;
  cardsAgainst: NumericValue;
  xgFor: NumericValue;
  xgAgainst: NumericValue;
  possessionFor: NumericValue;
  possessionAgainst: NumericValue;
  foulsFor: NumericValue;
  foulsAgainst: NumericValue;
  offsidesFor: NumericValue;
  offsidesAgainst: NumericValue;
  goalkeeperSavesFor: NumericValue;
  goalkeeperSavesAgainst: NumericValue;
  totalPassesFor: NumericValue;
  totalPassesAgainst: NumericValue;
  accuratePassesFor: NumericValue;
  accuratePassesAgainst: NumericValue;
  passAccuracyFor: NumericValue;
  passAccuracyAgainst: NumericValue;
  cardsFirstHalfFor: NumericValue;
  cardsSecondHalfFor: NumericValue;
  firstGoal: "scored" | "conceded" | "none" | null;
  additionalStatistics: {
    team: NormalizedAdditionalStatistic[];
    opponent: NormalizedAdditionalStatistic[];
  };
  result: "W" | "D" | "L";
};

export type AggregateCoverageKey = Exclude<keyof TeamManualStats, "formLast5">;

export type AggregateCoverage = {
  goals: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  cards: number;
  xg: number;
};

export type AggregatedLastMatches = TeamManualStats & {
  matchesCount: number;
  shotsOnTargetForLast5: NumericValue;
  shotsOnTargetAgainstLast5: NumericValue;
  coverage: AggregateCoverage;
  averages: Record<AggregateCoverageKey | "shotsOnTargetForLast5" | "shotsOnTargetAgainstLast5", NumericValue>;
};

export type TeamSampleAverages = {
  goalsFor: NumericValue;
  goalsAgainst: NumericValue;
  xgFor: NumericValue;
  xgAgainst: NumericValue;
  shotsFor: NumericValue;
  shotsAgainst: NumericValue;
  shotsOnTargetFor: NumericValue;
  shotsOnTargetAgainst: NumericValue;
  shotsOffTargetFor: NumericValue;
  blockedShotsFor: NumericValue;
  shotsInsideBoxFor: NumericValue;
  shotsOutsideBoxFor: NumericValue;
  cornersFor: NumericValue;
  cornersAgainst: NumericValue;
  yellowCardsFor: NumericValue;
  redCardsFor: NumericValue;
  cardsFor: NumericValue;
  cardsAgainst: NumericValue;
  foulsFor: NumericValue;
  possessionFor: NumericValue;
  goalkeeperSavesFor: NumericValue;
  totalPassesFor: NumericValue;
  accuratePassesFor: NumericValue;
  passAccuracyFor: NumericValue;
  halftimeGoalsFor: NumericValue;
  halftimeGoalsAgainst: NumericValue;
  secondHalfGoalsFor: NumericValue;
  secondHalfGoalsAgainst: NumericValue;
};

export type TeamSampleSummary = {
  sampleSize: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  cleanSheets: number;
  btts: number;
  over25: number;
  scoredFirst: number;
  concededFirst: number;
  cornersOver85: number;
  cornersOver95: number;
  cornersOver105: number;
  averages: TeamSampleAverages;
  coverage: Partial<Record<keyof TeamSampleAverages | "firstGoal", number>>;
};

export type TeamRecentData = {
  team: ApiFootballTeam;
  matches: NormalizedTeamMatchStats[];
  summary: TeamSampleSummary;
};

export type MatchStandingsTeam = {
  rank: number;
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  points: number;
  goalsDiff: number;
  form: string | null;
  description: string | null;
  all: ApiFootballStandingRecord;
  home: ApiFootballStandingRecord;
  away: ApiFootballStandingRecord;
};

export type MatchStandingsData = {
  available: boolean;
  reason: string | null;
  leagueName: string;
  leagueLogo: string | null;
  countryName: string;
  countryCode: string | null;
  home: MatchStandingsTeam | null;
  away: MatchStandingsTeam | null;
  contextRows: MatchStandingsTeam[];
  rankDifference: number | null;
  pointsDifference: number | null;
};

export type MatchInjury = {
  playerId: number | null;
  playerName: string;
  playerPhoto: string | null;
  playerPosition: string | null;
  teamId: number | null;
  teamName: string;
  teamLogo: string | null;
  type: "missing" | "questionable";
  reason: string | null;
  status: string;
  regularity: string | null;
};

export type MatchInjuriesData = {
  status: SectionStatus;
  reason: string | null;
  missing: MatchInjury[];
  questionable: MatchInjury[];
};

export type MatchLineupPlayer = {
  id: number | null;
  name: string;
  number: number | null;
  position: string | null;
  grid: string | null;
  playerPhoto: string | null;
  playerNationality: string | null;
  countryCode: string | null;
  captain: boolean;
};

export type MatchTeamLineup = {
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  formation: string | null;
  coachName: string | null;
  coachPhoto: string | null;
  coachNationality: string | null;
  coachCountryCode: string | null;
  startXI: MatchLineupPlayer[];
  substitutes: MatchLineupPlayer[];
};

export type HistoricalStarterPlayer = MatchLineupPlayer & {
  id: number;
  starts: number;
  sampleSize: number;
};

export type HistoricalTeamLineup = {
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  formation: string | null;
  sampleSize: number;
  players: HistoricalStarterPlayer[];
};

export type MatchLineupsData = {
  status: SectionStatus;
  reason: string | null;
  official: boolean;
  teams: MatchTeamLineup[];
  historicalStarters: HistoricalTeamLineup[];
};

export type PlayerInsight = {
  playerId: number;
  playerName: string;
  playerPhoto: string | null;
  playerNationality: string | null;
  countryCode: string | null;
  position: string | null;
  appearances: number;
  minutes: NumericValue;
  averageRating: NumericValue;
  goals: NumericValue;
  assists: NumericValue;
  shots: NumericValue;
  shotsOnTarget: NumericValue;
  passes: NumericValue;
  keyPasses: NumericValue;
  tackles: NumericValue;
  interceptions: NumericValue;
  goalkeeperSaves: NumericValue;
  yellowCards: NumericValue;
  redCards: NumericValue;
};

export type MatchPlayerInsights = {
  status: SectionStatus;
  reason: string | null;
  home: PlayerInsight[];
  away: PlayerInsight[];
};

export type H2HMatch = {
  fixtureId: number;
  date: string;
  homeTeam: ApiFootballTeam;
  awayTeam: ApiFootballTeam;
  homeGoals: NumericValue;
  awayGoals: NumericValue;
  halftimeHomeGoals: NumericValue;
  halftimeAwayGoals: NumericValue;
  winnerTeamId: number | null;
  btts: boolean | null;
  over25: boolean | null;
  totalCorners: NumericValue;
  totalCards: NumericValue;
  totalShots: NumericValue;
};

export type H2HData = {
  status: SectionStatus;
  reason: string | null;
  matches: H2HMatch[];
  homeWins: number;
  draws: number;
  awayWins: number;
  averageGoals: NumericValue;
  bttsCount: number;
  over25Count: number;
  olderThanTwoSeasons: number;
};

export type ProviderPredictionData = {
  winnerTeamId: number | null;
  winnerName: string | null;
  comment: string | null;
  winOrDraw: boolean | null;
  underOver: string | null;
  goalsHome: string | null;
  goalsAway: string | null;
  advice: string | null;
  percent: { home: NumericValue; draw: NumericValue; away: NumericValue };
};

export type ProviderOddsData = {
  updatedAt: string | null;
  bookmaker: string | null;
  markets: Array<{
    id: number | null;
    name: string;
    values: Array<{ label: string; odd: NumericValue }>;
  }>;
};

export type MatchSignal = {
  id: string;
  category:
    | "goals"
    | "corners"
    | "cards"
    | "shots"
    | "form"
    | "homeAway"
    | "standings"
    | "h2h"
    | "lineups"
    | "injuries"
    | "risk";
  strength: "weak" | "medium" | "strong";
  title: string;
  evidence: string;
  interpretation: string;
  confidence: number;
  coverage: string;
};

export type MatchRisk = {
  id: string;
  level: "low" | "medium" | "high";
  title: string;
  evidence: string;
  impact: string;
};

export type SectionStatus = "complete" | "partial" | "unavailable" | "error";

export type SectionCoverage = Record<
  | "fixture"
  | "recentForm"
  | "venueSplits"
  | "standings"
  | "teamStatistics"
  | "h2h"
  | "injuries"
  | "lineups"
  | "players"
  | "events"
  | "predictions"
  | "odds",
  { status: SectionStatus; samples: number; message: string }
>;

export type MatchFixtureData = Omit<
  FootballFixtureSummary,
  "leagueLogo" | "leagueFlag" | "countryCode" | "season" | "round" | "referee" | "venueCity"
> & {
  leagueLogo: string | null;
  leagueFlag: string | null;
  countryCode: string | null;
  countryName: string;
  referee: string | null;
  venueName: string | null;
  venueCity: string | null;
  season: number;
  round: string | null;
  score: {
    halftime: ApiFootballScore | null;
    fulltime: ApiFootballScore | null;
    extratime: ApiFootballScore | null;
    penalty: ApiFootballScore | null;
  };
};

export type FootballImportRequestSummary = {
  totalRequests: number;
  cacheStrategy: string;
  concurrencyLimit: number;
  endpoints: Array<{ endpoint: string; status: SectionStatus; requests: number; message: string }>;
};

export type FootballAnalysisSnapshot = {
  version: 2;
  fixture: MatchFixtureData;
  standings: MatchStandingsData | null;
  recentForm: {
    home: TeamRecentData;
    away: TeamRecentData;
  };
  venueSplits: {
    homeTeamAtHome: TeamRecentData;
    awayTeamAway: TeamRecentData;
  };
  h2h: H2HData | null;
  injuries: MatchInjuriesData;
  lineups: MatchLineupsData;
  playerInsights: MatchPlayerInsights;
  predictions: ProviderPredictionData | null;
  odds: ProviderOddsData | null;
  signals: MatchSignal[];
  risks: MatchRisk[];
  automaticSummary: string;
  coverage: SectionCoverage;
  warnings: string[];
  requestSummary: FootballImportRequestSummary;
  fetchedAt: string;
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
  snapshot: FootballAnalysisSnapshot;
  fetchedAt: string;
  warnings: string[];
  cache: { refreshed: boolean; persistent: boolean; warning?: string };
};

export type ProviderRequestOptions = {
  refresh?: boolean;
};

export interface FootballDataProvider {
  getFixturesByDate(date: string, options?: ProviderRequestOptions): Promise<ApiFootballFixture[]>;
  searchTeams(query: string, options?: ProviderRequestOptions): Promise<ApiFootballTeamSearchItem[]>;
  getTeamSeasonFixtures(
    teamId: number,
    beforeDate: string,
    season: number,
    options?: ProviderRequestOptions,
  ): Promise<ApiFootballFixture[]>;
  getTeamLastFixtures(
    teamId: number,
    beforeDate: string,
    season: number,
    limit: number,
    options?: ProviderRequestOptions,
  ): Promise<ApiFootballFixture[]>;
  getFixtureBundles(ids: number[], options?: ProviderRequestOptions): Promise<ApiFootballFixture[]>;
  getFixtureStatistics(
    fixtureId: number,
    options?: ProviderRequestOptions,
  ): Promise<ApiFootballTeamStatistics[]>;
  getFixtureEvents(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballEvent[]>;
  getFixturePlayers(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballFixturePlayers[]>;
  getFixtureLineups(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballLineup[]>;
  getHeadToHead(homeTeamId: number, awayTeamId: number, options?: ProviderRequestOptions): Promise<ApiFootballFixture[]>;
  getStandings(leagueId: number, season: number, options?: ProviderRequestOptions): Promise<ApiFootballStandingsResponse[]>;
  getTeamStatistics(
    leagueId: number,
    season: number,
    teamId: number,
    beforeDate: string,
    options?: ProviderRequestOptions,
  ): Promise<ApiFootballTeamSeasonStatistics>;
  getInjuries(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballInjury[]>;
  getPredictions(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballPrediction[]>;
  getOdds(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballOdds[]>;
  getFixtureDetails(fixtureId: number, options?: ProviderRequestOptions): Promise<ApiFootballFixture | null>;
}
