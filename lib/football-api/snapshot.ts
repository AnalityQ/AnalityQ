import { countryPresentation } from "../countries";
import { safeNumber } from "../calculations";
import { summarizeTeamSample } from "./aggregate";
import { countryCodeFromFlag, simplifyFixture } from "./normalize";
import type {
  ApiFootballFixture,
  ApiFootballFixturePlayers,
  ApiFootballInjury,
  ApiFootballLineup,
  ApiFootballOdds,
  ApiFootballPrediction,
  ApiFootballStandingsResponse,
  H2HData,
  H2HMatch,
  MatchFixtureData,
  MatchInjuriesData,
  MatchLineupPlayer,
  MatchLineupsData,
  MatchPlayerInsights,
  MatchRisk,
  MatchSignal,
  MatchStandingsData,
  MatchStandingsTeam,
  NormalizedTeamMatchStats,
  PlayerInsight,
  ProviderOddsData,
  ProviderPredictionData,
  TeamRecentData,
} from "./types";

function format(value: number | null, digits = 1) {
  return value === null ? null : value.toFixed(digits).replace(".", ",");
}

function average(values: Array<number | null | undefined>) {
  const available = values.filter((value): value is number => typeof value === "number");
  if (!available.length) return null;
  return available.reduce((sum, value) => sum + value, 0) / available.length;
}

export function buildMatchFixtureData(fixture: ApiFootballFixture): MatchFixtureData {
  const simplified = simplifyFixture(fixture);
  const country = countryPresentation(
    fixture.league.country,
    countryCodeFromFlag(fixture.league.flag),
  );
  return {
    ...simplified,
    leagueLogo: fixture.league.logo || null,
    leagueFlag: fixture.league.flag || null,
    countryCode: country.countryCode,
    countryName: country.countryName || fixture.league.country,
    referee: fixture.fixture.referee || null,
    venueName: fixture.fixture.venue?.name || null,
    venueCity: fixture.fixture.venue?.city || null,
    season: fixture.league.season as number,
    round: fixture.league.round || null,
    score: {
      halftime: fixture.score?.halftime || null,
      fulltime: fixture.score?.fulltime || null,
      extratime: fixture.score?.extratime || null,
      penalty: fixture.score?.penalty || null,
    },
  };
}

export function createTeamRecentData(
  team: TeamRecentData["team"],
  matches: NormalizedTeamMatchStats[],
): TeamRecentData {
  const ordered = [...matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  return { team, matches: ordered, summary: summarizeTeamSample(ordered) };
}

function standingTeam(row: MatchStandingsTeam | null) {
  return row;
}

export function normalizeStandings(
  raw: ApiFootballStandingsResponse[] | null,
  fixture: ApiFootballFixture,
): MatchStandingsData {
  const league = raw?.[0]?.league;
  const country = countryPresentation(
    league?.country || fixture.league.country,
    countryCodeFromFlag(league?.flag || fixture.league.flag),
  );
  const rows = (league?.standings || []).flat().map((row): MatchStandingsTeam => ({
    rank: row.rank,
    teamId: row.team.id,
    teamName: row.team.name,
    teamLogo: row.team.logo || null,
    points: row.points,
    goalsDiff: row.goalsDiff,
    form: row.form || null,
    description: row.description || null,
    all: row.all,
    home: row.home,
    away: row.away,
  }));
  const home = rows.find((row) => row.teamId === fixture.teams.home.id) || null;
  const away = rows.find((row) => row.teamId === fixture.teams.away.id) || null;
  const wantedRanks = new Set<number>();
  for (const selected of [home, away]) {
    if (!selected) continue;
    for (let rank = selected.rank - 2; rank <= selected.rank + 2; rank += 1) {
      if (rank > 0) wantedRanks.add(rank);
    }
  }
  const available = Boolean(home && away);
  const cupReason = fixture.league.standings === false
    ? "Te rozgrywki pucharowe nie posiadają klasycznej tabeli ligowej."
    : "API-Football nie zwróciło tabeli obejmującej obie drużyny.";
  return {
    available,
    reason: available ? null : cupReason,
    leagueName: league?.name || fixture.league.name,
    leagueLogo: league?.logo || fixture.league.logo || null,
    countryName: country.countryName || fixture.league.country,
    countryCode: country.countryCode,
    home: standingTeam(home),
    away: standingTeam(away),
    contextRows: rows
      .filter((row) => wantedRanks.has(row.rank))
      .sort((a, b) => a.rank - b.rank),
    rankDifference: home && away ? Math.abs(home.rank - away.rank) : null,
    pointsDifference: home && away ? home.points - away.points : null,
  };
}

export function normalizePlayerInsights(
  bundles: ApiFootballFixture[],
  homeTeamId: number,
  awayTeamId: number,
): MatchPlayerInsights {
  const addAvailable = (current: number | null, next: unknown) => {
    const value = safeNumber(next);
    return value === null ? current : (current ?? 0) + value;
  };

  function forTeam(teamId: number) {
    const players = new Map<number, PlayerInsight & { ratings: number[] }>();
    for (const fixture of bundles) {
      const team = fixture.players?.find((entry) => entry.team.id === teamId);
      for (const item of team?.players || []) {
        const statistics = item.statistics?.[0];
        if (!statistics) continue;
        const current = players.get(item.player.id) || {
          playerId: item.player.id,
          playerName: item.player.name,
          playerPhoto: item.player.photo || null,
          playerNationality: item.player.nationality || null,
          countryCode: countryPresentation(item.player.nationality).countryCode,
          position: statistics.games?.position || null,
          appearances: 0,
          minutes: null,
          averageRating: null,
          goals: null,
          assists: null,
          shots: null,
          shotsOnTarget: null,
          passes: null,
          keyPasses: null,
          tackles: null,
          interceptions: null,
          goalkeeperSaves: null,
          yellowCards: null,
          redCards: null,
          ratings: [],
        };
        current.appearances += 1;
        current.minutes = addAvailable(current.minutes, statistics.games?.minutes);
        current.goals = addAvailable(current.goals, statistics.goals?.total);
        current.assists = addAvailable(current.assists, statistics.goals?.assists);
        current.shots = addAvailable(current.shots, statistics.shots?.total);
        current.shotsOnTarget = addAvailable(current.shotsOnTarget, statistics.shots?.on);
        current.passes = addAvailable(current.passes, statistics.passes?.total);
        current.keyPasses = addAvailable(current.keyPasses, statistics.passes?.key);
        current.tackles = addAvailable(current.tackles, statistics.tackles?.total);
        current.interceptions = addAvailable(current.interceptions, statistics.tackles?.interceptions);
        current.goalkeeperSaves = addAvailable(current.goalkeeperSaves, statistics.goals?.saves);
        current.yellowCards = addAvailable(current.yellowCards, statistics.cards?.yellow);
        current.redCards = addAvailable(current.redCards, statistics.cards?.red);
        const rating = safeNumber(statistics.games?.rating);
        if (rating !== null) current.ratings.push(rating);
        players.set(item.player.id, current);
      }
    }
    return [...players.values()]
      .map(({ ratings, ...player }) => ({
        ...player,
        averageRating: average(ratings),
      }))
      .sort((a, b) =>
        (b.averageRating || 0) - (a.averageRating || 0) ||
        (b.minutes ?? -1) - (a.minutes ?? -1) ||
        (b.goals ?? -1) - (a.goals ?? -1),
      )
      .slice(0, 8);
  }
  const home = forTeam(homeTeamId);
  const away = forTeam(awayTeamId);
  return {
    status: home.length && away.length ? "complete" : home.length || away.length ? "partial" : "unavailable",
    reason: home.length || away.length
      ? null
      : "API-Football nie zwróciło statystyk zawodników dla ostatnich spotkań.",
    home,
    away,
  };
}

function lineupPlayer(
  player: ApiFootballLineup["startXI"] extends Array<infer U> | null | undefined ? U : never,
  playerMeta: Map<number, { photo: string | null; nationality: string | null; countryCode: string | null; captain: boolean }>,
): MatchLineupPlayer {
  const id = player?.player?.id || null;
  const meta = id ? playerMeta.get(id) : undefined;
  return {
    id,
    name: player?.player?.name || "Nieznany zawodnik",
    number: player?.player?.number || null,
    position: player?.player?.pos || null,
    grid: player?.player?.grid || null,
    playerPhoto: meta?.photo || null,
    playerNationality: meta?.nationality || null,
    countryCode: meta?.countryCode || null,
    captain: meta?.captain || false,
  };
}

export function normalizeLineups(
  current: ApiFootballLineup[] | null | undefined,
  currentPlayers: ApiFootballFixturePlayers[] | null | undefined,
  historyBundles: ApiFootballFixture[],
  homeTeamId: number,
  awayTeamId: number,
): MatchLineupsData {
  const playerMeta = new Map<number, { photo: string | null; nationality: string | null; countryCode: string | null; captain: boolean }>();
  for (const team of currentPlayers || []) {
    for (const item of team.players || []) {
      const stat = item.statistics?.[0];
      playerMeta.set(item.player.id, {
        photo: item.player.photo || null,
        nationality: item.player.nationality || null,
        countryCode: countryPresentation(item.player.nationality).countryCode,
        captain: stat?.games?.captain || false,
      });
    }
  }
  const teams = (current || []).map((lineup) => ({
    teamId: lineup.team.id,
    teamName: lineup.team.name,
    teamLogo: lineup.team.logo || null,
    formation: lineup.formation || null,
    coachName: lineup.coach?.name || null,
    coachPhoto: lineup.coach?.photo || null,
    coachNationality: null,
    coachCountryCode: null,
    startXI: (lineup.startXI || []).map((player) => lineupPlayer(player, playerMeta)),
    substitutes: (lineup.substitutes || []).map((player) => lineupPlayer(player, playerMeta)),
  }));
  const historicalStarters = [homeTeamId, awayTeamId].map((teamId) => {
    const starts = new Map<number, MatchLineupPlayer & { id: number; starts: number }>();
    const formations = new Map<string, number>();
    let sampleSize = 0;
    for (const fixture of historyBundles) {
      const lineup = fixture.lineups?.find((entry) => entry.team.id === teamId);
      if (!lineup) continue;
      sampleSize += 1;
      if (lineup.formation) {
        formations.set(lineup.formation, (formations.get(lineup.formation) || 0) + 1);
      }
      const fixturePlayers = fixture.players?.find((entry) => entry.team.id === teamId);
      const historyMeta = new Map<number, { photo: string | null; nationality: string | null; countryCode: string | null; captain: boolean }>();
      for (const item of fixturePlayers?.players || []) {
        const stat = item.statistics?.[0];
        historyMeta.set(item.player.id, {
          photo: item.player.photo || null,
          nationality: item.player.nationality || null,
          countryCode: countryPresentation(item.player.nationality).countryCode,
          captain: stat?.games?.captain || false,
        });
      }
      for (const entry of lineup.startXI || []) {
        const id = entry.player?.id;
        if (!id) continue;
        const player = lineupPlayer(entry, historyMeta);
        const currentStart = starts.get(id) || {
          ...player,
          id,
          starts: 0,
        };
        currentStart.starts += 1;
        currentStart.number ??= player.number;
        currentStart.position ??= player.position;
        currentStart.grid ??= player.grid;
        currentStart.playerPhoto ??= player.playerPhoto;
        currentStart.playerNationality ??= player.playerNationality;
        currentStart.countryCode ??= player.countryCode;
        currentStart.captain ||= player.captain;
        starts.set(id, currentStart);
      }
    }
    const team = historyBundles
      .flatMap((fixture) => fixture.lineups || [])
      .find((lineup) => lineup.team.id === teamId)?.team;
    return {
      teamId,
      teamName: team?.name || "Drużyna",
      teamLogo: team?.logo || null,
      formation: [...formations.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || null,
      sampleSize,
      players: [...starts.entries()]
        .map(([, value]) => ({ ...value, sampleSize }))
        .sort((a, b) => b.starts - a.starts)
        .slice(0, 18),
    };
  });
  return {
    status: teams.length === 2 ? "complete" : teams.length ? "partial" : "unavailable",
    reason: teams.length
      ? null
      : "Oficjalne składy nie zostały jeszcze opublikowane.",
    official: teams.length === 2 && teams.every((team) => team.startXI.length >= 11),
    teams,
    historicalStarters,
  };
}

export function normalizeInjuries(
  raw: ApiFootballInjury[] | null,
  playerInsights: MatchPlayerInsights,
): MatchInjuriesData {
  const allInsights = [...playerInsights.home, ...playerInsights.away];
  const normalized = (raw || []).map((injury) => {
    const playerId = injury.player?.id || null;
    const insight = playerId
      ? allInsights.find((player) => player.playerId === playerId)
      : undefined;
    const questionable = injury.player?.type?.toLowerCase().includes("question");
    return {
      playerId,
      playerName: injury.player?.name || "Nieznany zawodnik",
      playerPhoto: injury.player?.photo || insight?.playerPhoto || null,
      playerPosition: insight?.position || null,
      teamId: injury.team?.id || null,
      teamName: injury.team?.name || "Nieznana drużyna",
      teamLogo: injury.team?.logo || null,
      type: questionable ? "questionable" as const : "missing" as const,
      reason: injury.player?.reason || null,
      status: injury.player?.type || (questionable ? "Wątpliwy" : "Nieobecny"),
      regularity: insight
        ? `${insight.appearances} występów i ${insight.minutes} minut w analizowanej próbce`
        : null,
    };
  });
  return {
    status: raw === null ? "error" : raw?.length ? "complete" : "unavailable",
    reason: raw === null
      ? "Nie udało się pobrać danych o absencjach."
      : raw.length
        ? null
        : "Dostawca nie udostępnił danych o absencjach dla tego meczu.",
    missing: normalized.filter((injury) => injury.type === "missing"),
    questionable: normalized.filter((injury) => injury.type === "questionable"),
  };
}

function sumStatistic(fixture: ApiFootballFixture, aliases: string[]) {
  const accepted = new Set(aliases.map((alias) => alias.toLowerCase()));
  const values = (fixture.statistics || []).flatMap((team) =>
    (team.statistics || [])
      .filter((statistic) => accepted.has(statistic.type.toLowerCase()))
      .map((statistic) => safeNumber(statistic.value)),
  );
  if (!values.length || values.some((value) => value === null)) return null;
  return (values as number[]).reduce((sum, value) => sum + value, 0);
}

export function normalizeH2H(
  raw: ApiFootballFixture[] | null,
  details: ApiFootballFixture[],
  selectedSeason: number,
  selectedHomeTeamId: number,
  selectedAwayTeamId: number,
): H2HData {
  const detailMap = new Map(details.map((fixture) => [fixture.fixture.id, fixture]));
  const matches = (raw || []).slice(0, 10).map((fixture): H2HMatch => {
    const detailed = detailMap.get(fixture.fixture.id) || fixture;
    const homeGoals = safeNumber(fixture.goals.home);
    const awayGoals = safeNumber(fixture.goals.away);
    return {
      fixtureId: fixture.fixture.id,
      date: fixture.fixture.date,
      homeTeam: fixture.teams.home,
      awayTeam: fixture.teams.away,
      homeGoals,
      awayGoals,
      halftimeHomeGoals: safeNumber(fixture.score?.halftime?.home),
      halftimeAwayGoals: safeNumber(fixture.score?.halftime?.away),
      winnerTeamId: homeGoals === null || awayGoals === null || homeGoals === awayGoals
        ? null
        : homeGoals > awayGoals ? fixture.teams.home.id : fixture.teams.away.id,
      btts: homeGoals === null || awayGoals === null ? null : homeGoals > 0 && awayGoals > 0,
      over25: homeGoals === null || awayGoals === null ? null : homeGoals + awayGoals > 2.5,
      totalCorners: sumStatistic(detailed, ["Corner Kicks", "Corners"]),
      totalCards: sumStatistic(detailed, ["Yellow Cards", "Red Cards"]),
      totalShots: sumStatistic(detailed, ["Total Shots", "Shots Total"]),
    };
  });
  const homeWins = matches.filter((match) => match.winnerTeamId === selectedHomeTeamId).length;
  const awayWins = matches.filter((match) => match.winnerTeamId === selectedAwayTeamId).length;
  const draws = matches.filter(
    (match) =>
      match.homeGoals !== null &&
      match.awayGoals !== null &&
      match.homeGoals === match.awayGoals,
  ).length;
  const goals = matches
    .map((match) =>
      match.homeGoals === null || match.awayGoals === null
        ? null
        : match.homeGoals + match.awayGoals,
    );
  const seasons = (raw || []).slice(0, 10).map((fixture) => fixture.league.season);
  return {
    status: raw === null ? "error" : matches.length ? "complete" : "unavailable",
    reason: raw === null
      ? "Nie udało się pobrać bezpośrednich spotkań."
      : matches.length ? null : "API-Football nie zwróciło bezpośrednich spotkań tych drużyn.",
    matches,
    homeWins,
    draws,
    awayWins,
    averageGoals: average(goals),
    bttsCount: matches.filter((match) => match.btts === true).length,
    over25Count: matches.filter((match) => match.over25 === true).length,
    olderThanTwoSeasons: seasons.filter(
      (season) => typeof season === "number" && selectedSeason - season > 2,
    ).length,
  };
}

export function normalizePrediction(
  raw: ApiFootballPrediction[] | null,
): ProviderPredictionData | null {
  const prediction = raw?.[0]?.predictions;
  if (!prediction) return null;
  return {
    winnerTeamId: prediction.winner?.id || null,
    winnerName: prediction.winner?.name || null,
    comment: prediction.winner?.comment || null,
    winOrDraw: prediction.win_or_draw ?? null,
    underOver: prediction.under_over || null,
    goalsHome: prediction.goals?.home || null,
    goalsAway: prediction.goals?.away || null,
    advice: prediction.advice || null,
    percent: {
      home: safeNumber(prediction.percent?.home?.replace("%", "")),
      draw: safeNumber(prediction.percent?.draw?.replace("%", "")),
      away: safeNumber(prediction.percent?.away?.replace("%", "")),
    },
  };
}

export function normalizeOdds(raw: ApiFootballOdds[] | null): ProviderOddsData | null {
  const source = raw?.[0];
  const bookmaker = source?.bookmakers?.[0];
  if (!source || !bookmaker) return null;
  return {
    updatedAt: source.update || null,
    bookmaker: bookmaker.name || null,
    markets: (bookmaker.bets || []).map((bet) => ({
      id: bet.id || null,
      name: bet.name || "Rynek",
      values: (bet.values || []).map((value) => ({
        label: value.value || "Wartość",
        odd: safeNumber(value.odd),
      })),
    })),
  };
}

function signal(
  value: Omit<MatchSignal, "id"> & { id?: string },
): MatchSignal {
  return { ...value, id: value.id || `${value.category}-${value.title}` };
}

export function generateMatchSignals(input: {
  homeName: string;
  awayName: string;
  homeOverall: TeamRecentData;
  awayOverall: TeamRecentData;
  homeVenue: TeamRecentData;
  awayVenue: TeamRecentData;
  standings: MatchStandingsData | null;
  h2h: H2HData | null;
  injuries: MatchInjuriesData;
}): MatchSignal[] {
  const candidates: MatchSignal[] = [];
  const home = input.homeVenue.summary;
  const away = input.awayVenue.summary;
  const sampleCoverage = `${home.sampleSize} meczów ${input.homeName} u siebie i ${away.sampleSize} meczów ${input.awayName} na wyjeździe`;
  const confidence = Math.min(94, 45 + Math.min(home.sampleSize, away.sampleSize) * 8);
  if (home.averages.goalsFor !== null && away.averages.goalsAgainst !== null) {
    candidates.push(signal({
      category: "goals",
      strength: home.averages.goalsFor + away.averages.goalsAgainst >= 3 ? "strong" : "medium",
      title: `Profil bramkowy: ${input.homeName} kontra defensywa ${input.awayName}`,
      evidence: `${input.homeName} zdobywał u siebie średnio ${format(home.averages.goalsFor)} gola, a ${input.awayName} tracił na wyjazdach średnio ${format(away.averages.goalsAgainst)}.`,
      interpretation: "Zestawienie opisuje atak gospodarzy i liczby dopuszczane przez gości; nie przesądza wyniku meczu.",
      confidence,
      coverage: sampleCoverage,
    }));
  }
  if (home.averages.cornersFor !== null && away.averages.cornersAgainst !== null) {
    const combined = (home.averages.cornersFor + away.averages.cornersAgainst) / 2;
    candidates.push(signal({
      category: "corners",
      strength: combined >= 5.8 ? "strong" : "medium",
      title: `Przewaga ${input.homeName} w rzutach rożnych`,
      evidence: `${input.homeName} wykonywał u siebie średnio ${format(home.averages.cornersFor)} rożnego. ${input.awayName} pozwalał rywalom na wyjazdach na średnio ${format(away.averages.cornersAgainst)}; ${home.cornersOver85} z ${home.sampleSize} domowych meczów ${input.homeName} przekroczyło 8,5 rożnego łącznie.`,
      interpretation: "Dane wspierają scenariusz przewagi gospodarzy w liczbie rożnych.",
      confidence,
      coverage: sampleCoverage,
    }));
  }
  if (home.averages.shotsFor !== null && away.averages.shotsAgainst !== null) {
    candidates.push(signal({
      category: "shots",
      strength: home.averages.shotsFor >= away.averages.shotsAgainst ? "strong" : "medium",
      title: `Atak ${input.homeName} a strzały dopuszczane przez ${input.awayName}`,
      evidence: `${input.homeName} oddawał u siebie średnio ${format(home.averages.shotsFor)} strzału, a ${input.awayName} dopuszczał na wyjazdach średnio ${format(away.averages.shotsAgainst)}. Celne strzały ${input.homeName}: ${format(home.averages.shotsOnTargetFor) || "brak danych"} na mecz.`,
      interpretation: "Porównanie łączy wolumen ataku jednej drużyny z obciążeniem defensywy drugiej.",
      confidence,
      coverage: sampleCoverage,
    }));
  }
  if (home.averages.cardsFor !== null && away.averages.cardsFor !== null) {
    candidates.push(signal({
      category: "cards",
      strength: home.averages.cardsFor + away.averages.cardsFor >= 4 ? "strong" : "medium",
      title: `Kartki ${input.homeName} i ${input.awayName}`,
      evidence: `${input.homeName} otrzymywał u siebie średnio ${format(home.averages.cardsFor)} kartki, a ${input.awayName} na wyjazdach ${format(away.averages.cardsFor)}.`,
      interpretation: "To suma osobno raportowanych żółtych i czerwonych kartek, o ile oba pola były dostępne.",
      confidence: Math.min(confidence, 86),
      coverage: sampleCoverage,
    }));
  }
  if (home.sampleSize && away.sampleSize) {
    candidates.push(signal({
      category: "homeAway",
      strength: Math.abs(home.points / home.sampleSize - away.points / away.sampleSize) >= 1 ? "strong" : "medium",
      title: `Forma domowa ${input.homeName} kontra wyjazdowa ${input.awayName}`,
      evidence: `${input.homeName}: ${home.wins}-${home.draws}-${home.losses} u siebie (${home.points} pkt). ${input.awayName}: ${away.wins}-${away.draws}-${away.losses} na wyjeździe (${away.points} pkt).`,
      interpretation: "Forma w miejscu rozegrania meczu ma większe znaczenie niż sam bilans ogólny.",
      confidence,
      coverage: sampleCoverage,
    }));
  }
  if (input.standings?.home && input.standings.away) {
    candidates.push(signal({
      category: "standings",
      strength: Math.abs(input.standings.pointsDifference || 0) >= 6 ? "strong" : "medium",
      title: `Różnica w tabeli: ${input.homeName} i ${input.awayName}`,
      evidence: `${input.homeName} zajmuje ${input.standings.home.rank}. miejsce z ${input.standings.home.points} pkt, a ${input.awayName} ${input.standings.away.rank}. miejsce z ${input.standings.away.points} pkt.`,
      interpretation: `Różnica wynosi ${input.standings.rankDifference} miejsc i ${Math.abs(input.standings.pointsDifference || 0)} punktów.`,
      confidence: 90,
      coverage: `${input.standings.contextRows.length} wierszy kontekstu tabeli`,
    }));
  }
  if (input.h2h && input.h2h.matches.length >= 3) {
    candidates.push(signal({
      category: "h2h",
      strength: input.h2h.matches.length >= 5 ? "medium" : "weak",
      title: `Bezpośrednie mecze ${input.homeName} – ${input.awayName}`,
      evidence: `${input.homeName} wygrał ${input.h2h.homeWins} z ${input.h2h.matches.length} ostatnich H2H; ${input.h2h.over25Count} zakończyło się powyżej 2,5 gola.`,
      interpretation: input.h2h.olderThanTwoSeasons
        ? `${input.h2h.olderThanTwoSeasons} spotkań pochodzi sprzed ponad dwóch sezonów i ma niższą wagę.`
        : "Wyniki H2H są kontekstem, a nie zamiennikiem aktualnej formy.",
      confidence: Math.max(45, 78 - input.h2h.olderThanTwoSeasons * 5),
      coverage: `${input.h2h.matches.length} bezpośrednich spotkań`,
    }));
  }
  if (input.injuries.missing.length || input.injuries.questionable.length) {
    const names = [...input.injuries.missing, ...input.injuries.questionable]
      .slice(0, 3)
      .map((injury) => `${injury.playerName} (${injury.teamName})`)
      .join(", ");
    candidates.push(signal({
      category: "injuries",
      strength: input.injuries.missing.length >= 3 ? "strong" : "medium",
      title: "Potwierdzone i zgłoszone absencje",
      evidence: `${input.injuries.missing.length} nieobecnych i ${input.injuries.questionable.length} wątpliwych: ${names}.`,
      interpretation: "Wpływ absencji zależy od roli zawodników oraz ostatecznych składów.",
      confidence: 82,
      coverage: `${input.injuries.missing.length + input.injuries.questionable.length} rekordów dostawcy`,
    }));
  }
  const weight = { strong: 3, medium: 2, weak: 1 } as const;
  const seen = new Set<string>();
  return candidates
    .sort((a, b) => weight[b.strength] - weight[a.strength] || b.confidence - a.confidence)
    .filter((candidate) => {
      if (seen.has(candidate.category)) return false;
      seen.add(candidate.category);
      return true;
    })
    .slice(0, 8);
}

export function generateMatchRisks(input: {
  homeName: string;
  awayName: string;
  homeOverall: TeamRecentData;
  awayOverall: TeamRecentData;
  homeVenue: TeamRecentData;
  awayVenue: TeamRecentData;
  injuries: MatchInjuriesData;
  lineups: MatchLineupsData;
}): MatchRisk[] {
  const risks: MatchRisk[] = [];
  for (const [name, data, place] of [
    [input.homeName, input.homeVenue, "u siebie"],
    [input.awayName, input.awayVenue, "na wyjeździe"],
  ] as const) {
    if (data.summary.sampleSize < 3) {
      risks.push({
        id: `small-sample-${data.team.id}`,
        level: "high",
        title: `Mała próba ${name}`,
        evidence: `Próba ${place} obejmuje tylko ${data.summary.sampleSize} spotkania.`,
        impact: "Średnie dom/wyjazd mogą silnie zmienić się po jednym kolejnym meczu.",
      });
    }
    const xgCoverage = data.summary.coverage.xgFor || 0;
    if (xgCoverage < data.summary.sampleSize) {
      risks.push({
        id: `missing-xg-${data.team.id}`,
        level: xgCoverage === 0 ? "high" : "medium",
        title: `Niepełne xG ${name}`,
        evidence: `Dane xG są dostępne dla ${xgCoverage} z ${data.summary.sampleSize} meczów ${place}.`,
        impact: "Porównanie jakości sytuacji ma niższą pewność niż porównanie wyników i strzałów.",
      });
    }
  }
  if (!input.lineups.official) {
    risks.push({
      id: "lineups-unpublished",
      level: "medium",
      title: "Brak opublikowanych oficjalnych składów",
      evidence: input.lineups.reason || "API-Football nie zwróciło dwóch pełnych jedenastek.",
      impact: "Ocena absencji i ustawienia może zmienić się po publikacji składów.",
    });
  }
  if (input.injuries.status === "unavailable" || input.injuries.status === "error") {
    risks.push({
      id: "injuries-unavailable",
      level: "medium",
      title: "Niepełny kontekst absencji",
      evidence: input.injuries.reason || "Brak danych o absencjach.",
      impact: "Brak rekordu nie oznacza, że kadra jest kompletna.",
    });
  }
  for (const [name, overall, venue] of [
    [input.homeName, input.homeOverall, input.homeVenue],
    [input.awayName, input.awayOverall, input.awayVenue],
  ] as const) {
    if (!overall.summary.sampleSize || !venue.summary.sampleSize) continue;
    const overallPpg = overall.summary.points / overall.summary.sampleSize;
    const venuePpg = venue.summary.points / venue.summary.sampleSize;
    if (Math.abs(overallPpg - venuePpg) >= 0.8) {
      risks.push({
        id: `form-split-${venue.team.id}`,
        level: "medium",
        title: `Duża różnica formy ${name}`,
        evidence: `${format(overallPpg, 2)} pkt/mecz ogółem wobec ${format(venuePpg, 2)} pkt/mecz w analizowanym podziale dom/wyjazd.`,
        impact: "Forma ogólna może zacierać specyfikę miejsca rozegrania spotkania.",
      });
    }
  }
  return risks.slice(0, 8);
}

export function generateAutomaticSummary(input: {
  homeName: string;
  awayName: string;
  standings: MatchStandingsData | null;
  homeVenue: TeamRecentData;
  awayVenue: TeamRecentData;
  signals: MatchSignal[];
  risks: MatchRisk[];
  injuries: MatchInjuriesData;
}) {
  const paragraphs: string[] = [];
  if (input.standings?.home && input.standings.away) {
    paragraphs.push(
      `${input.homeName} przystępuje do meczu z ${input.standings.home.rank}. miejsca (${input.standings.home.points} pkt), a ${input.awayName} zajmuje ${input.standings.away.rank}. miejsce (${input.standings.away.points} pkt). Różnica wynosi ${Math.abs(input.standings.pointsDifference || 0)} punktów.`,
    );
  }
  const home = input.homeVenue.summary;
  const away = input.awayVenue.summary;
  if (home.averages.goalsFor !== null && away.averages.goalsAgainst !== null) {
    paragraphs.push(
      `${input.homeName} zdobywał u siebie średnio ${format(home.averages.goalsFor)} gola i tracił ${format(home.averages.goalsAgainst) || "brak pełnych danych"}. ${input.awayName} na wyjazdach zdobywał średnio ${format(away.averages.goalsFor) || "brak pełnych danych"} gola, a tracił ${format(away.averages.goalsAgainst)}.`,
    );
  }
  if (home.averages.shotsFor !== null && away.averages.shotsAgainst !== null) {
    paragraphs.push(
      `${input.homeName} oddawał u siebie średnio ${format(home.averages.shotsFor)} strzału (${format(home.averages.shotsOnTargetFor) || "brak danych"} celnego), natomiast ${input.awayName} dopuszczał na wyjazdach średnio ${format(away.averages.shotsAgainst)} strzału rywali.`,
    );
  }
  if (input.signals[0]) {
    paragraphs.push(`Najsilniejszy sygnał: ${input.signals[0].title}. ${input.signals[0].evidence}`);
  }
  if (input.risks[0]) {
    paragraphs.push(`Najważniejsze ryzyko: ${input.risks[0].title}. ${input.risks[0].evidence}`);
  }
  if (input.injuries.status === "complete") {
    paragraphs.push(
      `API-Football zgłasza ${input.injuries.missing.length} nieobecnych i ${input.injuries.questionable.length} wątpliwych zawodników.`,
    );
  } else if (input.injuries.reason) {
    paragraphs.push(input.injuries.reason);
  }
  return paragraphs.join("\n\n");
}
