import type {
  HistoricalStarterPlayer,
  HistoricalTeamLineup,
  MatchInjuriesData,
  MatchLineupPlayer,
  MatchPlayerInsights,
  PlayerInsight,
} from "./types";

type LegacyHistoricalStarterPlayer = Partial<HistoricalStarterPlayer> & {
  playerId?: number;
  playerName?: string;
};

type LegacyHistoricalTeamLineup = Omit<HistoricalTeamLineup, "players" | "sampleSize"> & {
  sampleSize?: number;
  matchesCount?: number;
  players: LegacyHistoricalStarterPlayer[];
};

export type PredictedLineupPlayer = MatchLineupPlayer & {
  id: number;
  starts: number;
  sampleSize: number;
  confidence: number;
  questionable: boolean;
};

export type PredictedTeamLineup = {
  available: boolean;
  reason: string | null;
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  formation: string | null;
  sampleSize: number;
  confidence: number | null;
  players: PredictedLineupPlayer[];
};

const unavailableReason = "Brak wystarczających danych do wiarygodnego przewidywania składu.";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function nonNegativeNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeHistoricalTeamLineup(historical: HistoricalTeamLineup): HistoricalTeamLineup {
  const legacy = historical as unknown as LegacyHistoricalTeamLineup;
  const teamSample = nonNegativeNumber(legacy.sampleSize || legacy.matchesCount);
  const fallbackSample = Math.max(
    teamSample,
    ...legacy.players.map((player) => nonNegativeNumber(player.sampleSize)),
  );
  const players = legacy.players.flatMap((player): HistoricalStarterPlayer[] => {
    const id = nonNegativeNumber(player.id || player.playerId);
    const name = String(player.name || player.playerName || "").trim();
    if (!id || !name) return [];
    return [{
      id,
      name,
      number: typeof player.number === "number" ? player.number : null,
      position: player.position || null,
      grid: player.grid || null,
      playerPhoto: player.playerPhoto || null,
      playerNationality: player.playerNationality || null,
      countryCode: player.countryCode || null,
      captain: Boolean(player.captain),
      starts: nonNegativeNumber(player.starts),
      sampleSize: nonNegativeNumber(player.sampleSize) || fallbackSample,
    }];
  });

  return {
    teamId: historical.teamId,
    teamName: historical.teamName,
    teamLogo: historical.teamLogo || null,
    formation: historical.formation || null,
    sampleSize: fallbackSample,
    players,
  };
}

function positionGroup(position: string | null) {
  const normalized = (position || "").toUpperCase();
  if (normalized.startsWith("G")) return "G";
  if (normalized.startsWith("D")) return "D";
  if (normalized.startsWith("F") || normalized.startsWith("A")) return "F";
  return "M";
}

export function predictedAppearanceConfidence(
  starts: number,
  sampleSize: number,
  insight: PlayerInsight | undefined,
  questionable: boolean,
) {
  if (sampleSize <= 0) return 0;
  const startRate = clamp(starts / sampleSize, 0, 1);
  const appearanceRate = insight ? clamp(insight.appearances / sampleSize, 0, 1) : 0;
  const minutesPerAppearance = insight && insight.appearances > 0 && insight.minutes !== null
    ? insight.minutes / insight.appearances
    : 0;
  const minutesRate = clamp(minutesPerAppearance / 90, 0, 1);
  const raw = 25 + startRate * 50 + appearanceRate * 15 + minutesRate * 10 - (questionable ? 20 : 0);
  return Math.round(clamp(raw, 20, 96));
}

function assignFormation(
  players: PredictedLineupPlayer[],
  formation: string,
) {
  const rows = formation.split("-").map(Number);
  if (rows.length < 2 || rows.some((count) => !Number.isInteger(count) || count < 1)) return null;
  if (rows.reduce((sum, count) => sum + count, 0) !== 10) return null;

  const remaining = [...players];
  function take(group: "G" | "D" | "M" | "F", amount: number) {
    const preferred = remaining.filter((player) => positionGroup(player.position) === group).slice(0, amount);
    const selected = preferred.length === amount
      ? preferred
      : [...preferred, ...remaining.filter((player) => !preferred.includes(player)).slice(0, amount - preferred.length)];
    for (const player of selected) remaining.splice(remaining.indexOf(player), 1);
    return selected;
  }

  const lineupRows = [take("G", 1)];
  rows.forEach((count, index) => {
    const group = index === 0 ? "D" : index === rows.length - 1 ? "F" : "M";
    lineupRows.push(take(group, count));
  });
  if (lineupRows.flat().length !== 11) return null;
  return lineupRows.flatMap((row, rowIndex) => row.map((player, columnIndex) => ({
    ...player,
    grid: `${rowIndex + 1}:${columnIndex + 1}`,
  })));
}

export function predictTeamLineup(
  historical: HistoricalTeamLineup,
  injuries: MatchInjuriesData,
  insights: MatchPlayerInsights,
): PredictedTeamLineup {
  const normalized = normalizeHistoricalTeamLineup(historical);
  const base = {
    teamId: normalized.teamId,
    teamName: normalized.teamName,
    teamLogo: normalized.teamLogo,
    formation: normalized.formation,
    sampleSize: normalized.sampleSize,
  };
  if (normalized.sampleSize < 3) {
    return { ...base, available: false, reason: unavailableReason, confidence: null, players: [] };
  }

  const missingIds = new Set(
    injuries.missing
      .filter((injury) => injury.teamId === normalized.teamId && injury.playerId !== null)
      .map((injury) => injury.playerId as number),
  );
  const questionableIds = new Set(
    injuries.questionable
      .filter((injury) => injury.teamId === normalized.teamId && injury.playerId !== null)
      .map((injury) => injury.playerId as number),
  );
  const insightMap = new Map(
    [...insights.home, ...insights.away].map((player) => [player.playerId, player]),
  );

  const candidates: PredictedLineupPlayer[] = normalized.players
    .filter((player) => !missingIds.has(player.id))
    .map((player) => {
      const questionable = questionableIds.has(player.id);
      const insight = insightMap.get(player.id);
      return {
        ...player,
        playerPhoto: player.playerPhoto || insight?.playerPhoto || null,
        playerNationality: player.playerNationality || insight?.playerNationality || null,
        countryCode: player.countryCode || insight?.countryCode || null,
        position: player.position || insight?.position || null,
        confidence: predictedAppearanceConfidence(
          player.starts,
          player.sampleSize,
          insight,
          questionable,
        ),
        questionable,
      };
    })
    .sort((a, b) => b.confidence - a.confidence || b.starts - a.starts || a.name.localeCompare(b.name));

  const assigned = normalized.formation
    ? assignFormation(candidates, normalized.formation)
    : candidates.slice(0, 11).map((player) => ({ ...player, grid: null }));
  if (!assigned || assigned.length !== 11) {
    return { ...base, available: false, reason: unavailableReason, confidence: null, players: [] };
  }
  const confidence = Math.round(assigned.reduce((sum, player) => sum + player.confidence, 0) / assigned.length);
  return { ...base, available: true, reason: null, confidence, players: assigned };
}

export const predictedLineupRule =
  "Najpierw pokazujemy skład oficjalny z API-Football. Gdy nie jest jeszcze dostępny, przewidywanie opiera się na minimum 3 historycznych składach, najczęstszej formacji, liczbie startów, występów i minutach. Pewność = 25% + 50% × udział startów + 15% × udział występów + 10% × średni udział minut w pełnym meczu; zawodnik wątpliwy otrzymuje karę 20 p.p. Wynik jest ograniczony do 20–96%.";
