"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  normalizeHistoricalTeamLineup,
  predictTeamLineup,
  predictedLineupRule,
  type PredictedLineupPlayer,
} from "@/lib/football-api/predicted-lineup";
import type {
  FootballAnalysisSnapshot,
  MatchLineupPlayer,
  PlayerInsight,
} from "@/lib/football-api/types";
import { localizePlayerPosition, localizeTeamName } from "@/lib/countries";
import { formatPolishCount } from "@/lib/polish-count";
import { CountryLabel, PersonPhoto, TeamLogo } from "./ApiImage";

type DisplayPlayer = MatchLineupPlayer & {
  id: number | null;
  starts?: number;
  sampleSize?: number;
  confidence?: number;
  questionable?: boolean;
};

type DisplayTeam = {
  teamId: number;
  teamName: string;
  teamLogo: string | null;
  formation: string | null;
  coachName: string | null;
  coachPhoto: string | null;
  coachNationality: string | null;
  coachCountryCode: string | null;
  status: "official" | "predicted" | "unavailable";
  statusLabel: string;
  sourceNote: string | null;
  players: DisplayPlayer[];
  substitutes: DisplayPlayer[];
  confidence: number | null;
  reason: string | null;
};

type SelectedPlayer = {
  player: DisplayPlayer;
  team: DisplayTeam;
  insight: PlayerInsight | undefined;
  availability: string | null;
};

function formatUpdate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "brak daty aktualizacji";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatValue(value: number | null | undefined, digits = 0) {
  return typeof value === "number" ? value.toFixed(digits).replace(".", ",") : "brak danych";
}

function pitchPosition(player: DisplayPlayer, players: DisplayPlayer[]) {
  const [rowValue, columnValue] = (player.grid || "").split(":").map(Number);
  const row = Number.isInteger(rowValue) && rowValue > 0 ? rowValue : 1;
  const column = Number.isInteger(columnValue) && columnValue > 0 ? columnValue : 1;
  const rows = players.map((item) => Number((item.grid || "1:1").split(":")[0]) || 1);
  const maxRow = Math.max(...rows, 1);
  const rowPlayers = players.filter((item) => (Number((item.grid || "1:1").split(":")[0]) || 1) === row);
  const maxColumn = Math.max(...rowPlayers.map((item) => Number((item.grid || "1:1").split(":")[1]) || 1), rowPlayers.length, 1);
  return {
    left: `${(column / (maxColumn + 1)) * 100}%`,
    top: `${maxRow === 1 ? 50 : 91 - ((row - 1) / (maxRow - 1)) * 82}%`,
  };
}

function PlayerSheet({ selected, onClose }: { selected: SelectedPlayer; onClose: () => void }) {
  const { player, insight, availability, team } = selected;
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusableSelector = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";
    const focusTimer = window.setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus();
    }, 0);
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div className="player-sheet-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside ref={dialogRef} className="player-sheet" role="dialog" aria-modal="true" aria-labelledby="player-sheet-title">
        <button type="button" className="player-sheet-close" onClick={onClose} aria-label="Zamknij profil zawodnika">Zamknij</button>
        <div className="player-sheet-identity">
          <PersonPhoto src={player.playerPhoto || insight?.playerPhoto} alt={player.name} size={84} />
          <div>
            <p>{localizeTeamName(team.teamName)}</p>
            <h3 id="player-sheet-title">{player.name}</h3>
            {(player.playerNationality || insight?.playerNationality) && (
              <CountryLabel code={player.countryCode || insight?.countryCode} name={player.playerNationality || insight?.playerNationality} />
            )}
          </div>
        </div>
        {availability && <p className="player-sheet-alert">Status: {availability}</p>}
        <div className="player-sheet-grid">
          <div><span>Pozycja</span><strong>{localizePlayerPosition(player.position || insight?.position) || "brak danych"}</strong></div>
          <div><span>Wiek</span><strong>brak danych</strong></div>
          <div><span>Minuty</span><strong>{formatValue(insight?.minutes)}</strong></div>
          <div><span>Starty</span><strong>{player.starts ?? "brak danych"}</strong></div>
          <div><span>Gole</span><strong>{formatValue(insight?.goals)}</strong></div>
          <div><span>Asysty</span><strong>{formatValue(insight?.assists)}</strong></div>
          <div><span>Rating</span><strong>{formatValue(insight?.averageRating, 2)}</strong></div>
          <div><span>Kartki</span><strong>{insight?.yellowCards === null || insight?.yellowCards === undefined ? "brak danych" : `${insight.yellowCards} ż. / ${insight.redCards ?? 0} cz.`}</strong></div>
          <div><span>Ostatnia forma</span><strong>brak danych mecz po meczu</strong></div>
          <div><span>Pewność występu</span><strong>{player.confidence === undefined ? "skład oficjalny" : `${player.confidence}%`}</strong></div>
        </div>
      </aside>
    </div>
  );
}

function TacticalTeam({
  team,
  snapshot,
  onPlayer,
}: {
  team: DisplayTeam;
  snapshot: FootballAnalysisSnapshot;
  onPlayer: (player: DisplayPlayer, team: DisplayTeam) => void;
}) {
  const historicalSource = snapshot.lineups.historicalStarters.find((item) => item.teamId === team.teamId);
  const historical = historicalSource ? normalizeHistoricalTeamLineup(historicalSource) : null;
  const absences = [...snapshot.injuries.missing, ...snapshot.injuries.questionable]
    .filter((injury) => injury.teamId === team.teamId);
  const hasPitchLayout = team.players.length === 11
    && Boolean(team.formation)
    && team.players.every((player) => /^\d+:\d+$/.test(player.grid || ""));

  return (
    <section className="tactical-team">
      <header className="tactical-team-header">
        <div className="tactical-team-title">
          <TeamLogo src={team.teamLogo} alt={localizeTeamName(team.teamName)} size={48} />
          <div><h3>{localizeTeamName(team.teamName)}</h3><p>{team.formation || "formacja: brak danych"}</p>{team.sourceNote && <small>{team.sourceNote}</small>}</div>
        </div>
        <span className={`tactical-status tactical-status-${team.status}`}>{team.statusLabel}</span>
      </header>

      <div className="tactical-coach-row">
        {team.coachName ? (
          <><PersonPhoto src={team.coachPhoto} alt={team.coachName} size={38} /><div><strong>{team.coachName}</strong><span>Trener{team.coachNationality ? ` · ${team.coachNationality}` : ""}</span></div></>
        ) : <span>Trener: brak danych</span>}
        <small>Aktualizacja: {formatUpdate(snapshot.fetchedAt)}</small>
      </div>

      {hasPitchLayout ? (
        <div className="tactical-pitch" aria-label={`${team.statusLabel}: ${localizeTeamName(team.teamName)}`}>
          {team.players.map((player, index) => {
            const injury = absences.find((item) => item.playerId !== null && item.playerId === player.id);
            const position = pitchPosition(player, team.players);
            return (
              <button
                key={player.id || `${player.name}-${index}`}
                type="button"
                className={`tactical-player ${injury || player.questionable ? "tactical-player-alert" : ""}`}
                style={position}
                onClick={() => onPlayer(player, team)}
                aria-label={`Pokaż profil: ${player.name}`}
              >
                <span className="tactical-player-photo"><PersonPhoto src={player.playerPhoto} alt="" size={38} />{player.number !== null && <b>{player.number}</b>}</span>
                <strong>{player.name}</strong>
                <small>{localizePlayerPosition(player.position) || "—"}{player.captain ? " · kapitan" : ""}</small>
                {player.confidence !== undefined && <em>{player.confidence}% · {player.starts}/{player.sampleSize}</em>}
              </button>
            );
          })}
        </div>
      ) : team.players.length === 11 ? (
        <div className="tactical-selection-list" aria-label={`${team.statusLabel}: ${localizeTeamName(team.teamName)}`}>
          <p>Przewidywana jedenastka według częstotliwości startów. Brak potwierdzonej formacji, dlatego nie ustawiamy zawodników na boisku.</p>
          <div>
            {team.players.map((player, index) => (
              <button
                key={player.id || `${player.name}-${index}`}
                type="button"
                onClick={() => onPlayer(player, team)}
                title={player.name}
              >
                <PersonPhoto src={player.playerPhoto} alt="" size={36} />
                <span><strong>{player.name}</strong><small>{localizePlayerPosition(player.position) || "Pozycja: brak danych"}</small></span>
                {player.confidence !== undefined && <em>{player.confidence}% · {player.starts}/{player.sampleSize}</em>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="tactical-pitch tactical-pitch-empty"><p>{team.reason || "Brak danych o składzie."}</p></div>
      )}

      {team.substitutes.length > 0 && (
        <div className="tactical-list"><h4>Rezerwowi</h4><div>{team.substitutes.map((player, index) => <button key={player.id || `${player.name}-${index}`} type="button" onClick={() => onPlayer(player, team)}>{player.number !== null ? `#${player.number} ` : ""}{player.name}</button>)}</div></div>
      )}
      {team.status !== "official" && historical && (
        <div className="tactical-list"><h4>Najczęściej rozpoczynający</h4><div>{historical.players.slice(0, 11).map((player) => (
          <span key={player.id}>{player.name} · {player.starts}/{player.sampleSize}</span>
        ))}</div></div>
      )}
      {absences.length > 0 && (
        <div className="tactical-list tactical-absence-list"><h4>Nieobecni i wątpliwi</h4><div>{absences.map((injury) => <span key={`${injury.playerId}-${injury.playerName}`}>{injury.playerName} · {injury.type === "missing" ? "nieobecny" : "wątpliwy"}</span>)}</div></div>
      )}
    </section>
  );
}

export function TacticalLineups({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const [selected, setSelected] = useState<SelectedPlayer | null>(null);
  const teams = useMemo(() => {
    const fixtureTeams = [snapshot.fixture.homeTeam, snapshot.fixture.awayTeam];
    return fixtureTeams.map((fixtureTeam): DisplayTeam => {
      const official = snapshot.lineups.teams.find((team) => team.teamId === fixtureTeam.id && team.startXI.length >= 11);
      if (official) {
        return {
          ...official,
          status: "official",
          statusLabel: "Oficjalny skład",
          sourceNote: "Skład opublikowany przez API-Football",
          players: official.startXI,
          confidence: null,
          reason: null,
        };
      }
      const historicalSource = snapshot.lineups.historicalStarters.find((team) => team.teamId === fixtureTeam.id);
      const historical = historicalSource ? normalizeHistoricalTeamLineup(historicalSource) : null;
      const predicted = historical
        ? predictTeamLineup(historical, snapshot.injuries, snapshot.playerInsights)
        : null;
      if (predicted?.available) {
        return {
          teamId: fixtureTeam.id,
          teamName: fixtureTeam.name,
          teamLogo: fixtureTeam.logo || predicted.teamLogo,
          formation: predicted.formation,
          coachName: null,
          coachPhoto: null,
          coachNationality: null,
          coachCountryCode: null,
          status: "predicted",
          statusLabel: "Przewidywany skład",
          sourceNote: `${formatPolishCount(predicted.sampleSize, "match")} w próbie · średnia pewność ${predicted.confidence}%`,
          players: predicted.players as PredictedLineupPlayer[],
          substitutes: [],
          confidence: predicted.confidence,
          reason: null,
        };
      }
      return {
        teamId: fixtureTeam.id,
        teamName: fixtureTeam.name,
        teamLogo: fixtureTeam.logo || historical?.teamLogo || null,
        formation: historical?.formation || null,
        coachName: null,
        coachPhoto: null,
        coachNationality: null,
        coachCountryCode: null,
        status: "unavailable",
        statusLabel: "Brak danych",
        sourceNote: historical ? `Próba: ${formatPolishCount(historical.sampleSize, "match")}` : null,
        players: [],
        substitutes: [],
        confidence: null,
        reason: predicted?.reason || "Brak wystarczających danych do wiarygodnego przewidywania składu.",
      };
    });
  }, [snapshot]);

  function openPlayer(player: DisplayPlayer, team: DisplayTeam) {
    const insight = [...snapshot.playerInsights.home, ...snapshot.playerInsights.away]
      .find((item) => item.playerId === player.id);
    const injury = [...snapshot.injuries.missing, ...snapshot.injuries.questionable]
      .find((item) => item.playerId !== null && item.playerId === player.id);
    setSelected({
      player,
      team,
      insight,
      availability: injury ? (injury.type === "missing" ? "Nieobecny" : "Wątpliwy") : null,
    });
  }

  const closePlayer = useCallback(() => setSelected(null), []);

  return (
    <div className="space-y-5">
      <details className="prediction-rule">
        <summary>Jak liczymy pewność przewidywanego składu?</summary>
        <p>{predictedLineupRule}</p>
      </details>
      <div className="tactical-lineups-grid">
        {teams.map((team) => <TacticalTeam key={team.teamId} team={team} snapshot={snapshot} onPlayer={openPlayer} />)}
      </div>
      {selected && <PlayerSheet selected={selected} onClose={closePlayer} />}
    </div>
  );
}
