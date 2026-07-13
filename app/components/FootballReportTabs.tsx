"use client";

import { useState, type ReactNode } from "react";
import type {
  FootballAnalysisSnapshot,
  MatchLineupsData,
  MatchStandingsData,
  NormalizedTeamMatchStats,
  PlayerInsight,
  TeamRecentData,
  TeamSampleSummary,
} from "@/lib/football-api/types";
import type { PremiumSections } from "@/lib/types";
import { CountryLabel, LeagueLogo, PersonPhoto, TeamLogo } from "./ApiImage";
import { PremiumLockCard } from "./PremiumLockCard";

type TabKey =
  | "summary"
  | "recent"
  | "venue"
  | "standings"
  | "goals"
  | "corners"
  | "cards"
  | "shots"
  | "h2h"
  | "lineups"
  | "players"
  | "signals"
  | "odds"
  | "quality";

const tabs: Array<{ key: TabKey; label: string; premium: boolean }> = [
  { key: "summary", label: "Podsumowanie", premium: false },
  { key: "recent", label: "Ostatnie 5", premium: false },
  { key: "venue", label: "Dom / wyjazd", premium: false },
  { key: "standings", label: "Tabela", premium: false },
  { key: "goals", label: "Gole i połowy", premium: true },
  { key: "corners", label: "Rzuty rożne", premium: true },
  { key: "cards", label: "Kartki i faule", premium: true },
  { key: "shots", label: "Strzały", premium: true },
  { key: "h2h", label: "H2H", premium: true },
  { key: "lineups", label: "Składy i absencje", premium: true },
  { key: "players", label: "Kluczowi zawodnicy", premium: true },
  { key: "signals", label: "Ryzyko i sygnały", premium: true },
  { key: "odds", label: "Kursy", premium: false },
  { key: "quality", label: "Jakość danych", premium: false },
];

function value(number: number | null, suffix = "", digits = 1) {
  return number === null ? "—" : `${number.toFixed(digits).replace(".", ",")}${suffix}`;
}

function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function Stat({ label, value: statValue, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="football-stat-card">
      <span>{label}</span>
      <strong>{statValue}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

function SectionMessage({ children }: { children: ReactNode }) {
  return <p className="football-section-message">{children}</p>;
}

function FormPill({ result }: { result: "W" | "D" | "L" }) {
  const label = result === "W" ? "Wygrana" : result === "D" ? "Remis" : "Porażka";
  return <span className={`result-pill result-${result.toLowerCase()}`} title={label}>{result}<span className="sr-only"> — {label}</span></span>;
}

function SummaryGrid({ summary, place }: { summary: TeamSampleSummary; place: string }) {
  const sample = `${summary.sampleSize} ${summary.sampleSize === 1 ? "mecz" : "meczów"} · ${place}`;
  return (
    <div className="football-summary-grid">
      <Stat label="Bilans W–R–P" value={`${summary.wins}–${summary.draws}–${summary.losses}`} note={`${summary.points} pkt · ${sample}`} />
      <Stat label="Gole zdobyte" value={value(summary.averages.goalsFor)} note={sample} />
      <Stat label="Gole stracone" value={value(summary.averages.goalsAgainst)} note={sample} />
      <Stat label="xG" value={value(summary.averages.xgFor, "", 2)} note={`${summary.coverage.xgFor || 0}/${summary.sampleSize} meczów`} />
      <Stat label="Strzały" value={value(summary.averages.shotsFor)} note={`${summary.coverage.shotsFor || 0}/${summary.sampleSize} meczów`} />
      <Stat label="Celne strzały" value={value(summary.averages.shotsOnTargetFor)} note={`${summary.coverage.shotsOnTargetFor || 0}/${summary.sampleSize} meczów`} />
      <Stat label="Rzuty rożne" value={value(summary.averages.cornersFor)} note={`${summary.coverage.cornersFor || 0}/${summary.sampleSize} meczów`} />
      <Stat label="Kartki" value={value(summary.averages.cardsFor)} note={`${summary.coverage.cardsFor || 0}/${summary.sampleSize} meczów`} />
      <Stat label="Czyste konta" value={`${summary.cleanSheets}/${summary.sampleSize}`} note={sample} />
      <Stat label="BTTS" value={`${summary.btts}/${summary.sampleSize}`} note={sample} />
      <Stat label="Powyżej 2,5 gola" value={`${summary.over25}/${summary.sampleSize}`} note={sample} />
      <Stat label="Pierwsza bramka" value={`${summary.scoredFirst}/${summary.sampleSize}`} note={`${summary.coverage.firstGoal || 0} meczów ze zdarzeniami`} />
    </div>
  );
}

function Pair({ label, home, away, homeName, awayName, suffix = "" }: { label: string; home: number | null; away: number | null; homeName: string; awayName: string; suffix?: string }) {
  const max = Math.max(home || 0, away || 0, 1);
  return (
    <div className="football-compare-row">
      <div className="football-compare-label"><span>{label}</span><small>{homeName} vs {awayName}</small></div>
      <div className="football-compare-values"><strong>{value(home, suffix)}</strong><strong>{value(away, suffix)}</strong></div>
      <div className="football-compare-bars" aria-hidden="true">
        <span style={{ width: `${((home || 0) / max) * 100}%` }} />
        <span style={{ width: `${((away || 0) / max) * 100}%` }} />
      </div>
    </div>
  );
}

function MatchCard({ match, teamName }: { match: NormalizedTeamMatchStats; teamName: string }) {
  const homeName = match.isHome ? teamName : match.opponentName;
  const awayName = match.isHome ? match.opponentName : teamName;
  const homeGoals = match.isHome ? match.goalsFor : match.goalsAgainst;
  const awayGoals = match.isHome ? match.goalsAgainst : match.goalsFor;
  const order = (forValue: number | null, againstValue: number | null) => match.isHome
    ? `${value(forValue, "", 0)}–${value(againstValue, "", 0)}`
    : `${value(againstValue, "", 0)}–${value(forValue, "", 0)}`;
  return (
    <article className="recent-match-card">
      <div className="recent-match-top">
        <div>
          <p>{date(match.date)} · <span className="venue-badge">{match.isHome ? "DOM" : "WYJAZD"}</span></p>
          <div className="recent-score-line">
            <TeamLogo src={match.isHome ? match.teamLogo : match.opponentLogo} alt={homeName} size={30} />
            <strong>{homeName} {value(homeGoals, "", 0)}:{value(awayGoals, "", 0)} {awayName}</strong>
            <TeamLogo src={match.isHome ? match.opponentLogo : match.teamLogo} alt={awayName} size={30} />
          </div>
        </div>
        <FormPill result={match.result} />
      </div>
      <div className="recent-match-stats">
        <span>Strzały <b>{order(match.shotsFor, match.shotsAgainst)}</b></span>
        <span>Celne <b>{order(match.shotsOnTargetFor, match.shotsOnTargetAgainst)}</b></span>
        <span>xG <b>{match.isHome ? `${value(match.xgFor, "", 2)}–${value(match.xgAgainst, "", 2)}` : `${value(match.xgAgainst, "", 2)}–${value(match.xgFor, "", 2)}`}</b></span>
        <span>Rożne <b>{order(match.cornersFor, match.cornersAgainst)}</b></span>
        <span>Kartki <b>{order(match.cardsFor, match.cardsAgainst)}</b></span>
        <span>Posiadanie <b>{match.isHome ? `${value(match.possessionFor, "%", 0)}–${value(match.possessionAgainst, "%", 0)}` : `${value(match.possessionAgainst, "%", 0)}–${value(match.possessionFor, "%", 0)}`}</b></span>
      </div>
    </article>
  );
}

function RecentTeam({ data, place }: { data: TeamRecentData; place: string }) {
  return (
    <section className="football-team-section">
      <div className="football-team-title"><TeamLogo src={data.team.logo} alt={data.team.name} size={48} /><div><h3>{data.team.name}</h3><p>{data.summary.sampleSize} spotkań · {place}</p></div></div>
      <SummaryGrid summary={data.summary} place={place} />
      <div className="recent-match-list">
        {data.matches.map((match) => <MatchCard key={match.fixtureId} match={match} teamName={data.team.name} />)}
      </div>
      {!data.matches.length && <SectionMessage>API-Football nie zwróciło zakończonych meczów {data.team.name} przed analizowanym spotkaniem.</SectionMessage>}
    </section>
  );
}

function ManualOverride({ title, text }: { title: string; text?: string }) {
  if (!text?.trim()) return null;
  return <aside className="manual-override"><strong>{title} — korekta administratora</strong><p>{text}</p></aside>;
}

function SummaryTab({ snapshot, summary }: { snapshot: FootballAnalysisSnapshot; summary: string }) {
  return (
    <div className="space-y-5">
      <section className="football-narrative"><p className="eyebrow">Raport dla tego meczu</p><p>{summary || snapshot.automaticSummary || "Raport zawiera zbyt mało danych, aby utworzyć liczbowe podsumowanie bez uogólnień."}</p></section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="football-panel"><h3>Forma w miejscu meczu</h3><Pair label="Punkty w próbce" home={snapshot.venueSplits.homeTeamAtHome.summary.points} away={snapshot.venueSplits.awayTeamAway.summary.points} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} /><Pair label="Średnie gole" home={snapshot.venueSplits.homeTeamAtHome.summary.averages.goalsFor} away={snapshot.venueSplits.awayTeamAway.summary.averages.goalsFor} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} /><Pair label="Średnie strzały" home={snapshot.venueSplits.homeTeamAtHome.summary.averages.shotsFor} away={snapshot.venueSplits.awayTeamAway.summary.averages.shotsFor} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} /></section>
        <section className="football-panel"><h3>Najważniejsze sygnały</h3><div className="signal-list">{snapshot.signals.slice(0, 4).map((signal) => <article key={signal.id} className={`signal-card signal-${signal.strength}`}><div><span>{signal.strength === "strong" ? "Silny" : signal.strength === "medium" ? "Średni" : "Słaby"}</span><small>{signal.confidence}% pewności</small></div><h4>{signal.title}</h4><p>{signal.evidence}</p><small>{signal.coverage}</small></article>)}</div>{!snapshot.signals.length && <SectionMessage>Brakuje wspólnego zestawu liczb obu drużyn wymaganego do wygenerowania konkretnego sygnału.</SectionMessage>}</section>
      </div>
    </div>
  );
}

function VenueTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const home = snapshot.venueSplits.homeTeamAtHome;
  const away = snapshot.venueSplits.awayTeamAway;
  return (
    <div className="space-y-5">
      {(home.summary.sampleSize < 3 || away.summary.sampleSize < 3) && <SectionMessage>Ostrzeżenie: co najmniej jedna próbka dom/wyjazd ma mniej niż 3 mecze, więc średnie są podatne na pojedynczy nietypowy wynik.</SectionMessage>}
      <div className="grid gap-4 lg:grid-cols-2"><RecentTeam data={home} place="u siebie" /><RecentTeam data={away} place="na wyjeździe" /></div>
      <section className="football-panel"><h3>Atak a liczby dopuszczane przez przeciwnika</h3><Pair label="Gole: atak / defensywa rywala" home={home.summary.averages.goalsFor} away={away.summary.averages.goalsAgainst} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} /><Pair label="Strzały: atak / defensywa rywala" home={home.summary.averages.shotsFor} away={away.summary.averages.shotsAgainst} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} /><Pair label="Rożne: wywalczone / oddane" home={home.summary.averages.cornersFor} away={away.summary.averages.cornersAgainst} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} /></section>
    </div>
  );
}

function standingRecord(record: MatchStandingsData["home"] extends infer U ? U : never, place: "home" | "away") {
  return record?.[place];
}

function StandingsTab({ data }: { data: MatchStandingsData | null }) {
  if (!data?.available || !data.home || !data.away) return <SectionMessage>{data?.reason || "API-Football nie zwróciło tabeli dla tych rozgrywek."}</SectionMessage>;
  return (
    <div className="space-y-5">
      <div className="football-league-heading"><LeagueLogo src={data.leagueLogo} alt={data.leagueName} size={54} /><div><h3>{data.leagueName}</h3><CountryLabel code={data.countryCode} name={data.countryName} /></div></div>
      <div className="football-summary-grid"><Stat label="Różnica miejsc" value={data.rankDifference} note={`${data.home.teamName}: ${data.home.rank}. · ${data.away.teamName}: ${data.away.rank}.`} /><Stat label="Różnica punktów" value={Math.abs(data.pointsDifference || 0)} note={`${data.home.points}–${data.away.points} pkt`} /><Stat label={`${data.home.teamName} · bilans`} value={`${data.home.all.win}–${data.home.all.draw}–${data.home.all.lose}`} note={`${data.home.all.goals.for}:${data.home.all.goals.against} w bramkach`} /><Stat label={`${data.away.teamName} · bilans`} value={`${data.away.all.win}–${data.away.all.draw}–${data.away.all.lose}`} note={`${data.away.all.goals.for}:${data.away.all.goals.against} w bramkach`} /></div>
      <div className="football-table-scroll"><table className="football-table"><thead><tr><th>M.</th><th>Drużyna</th><th>M</th><th>W</th><th>R</th><th>P</th><th>Bramki</th><th>+/-</th><th>Pkt</th><th>Forma</th></tr></thead><tbody>{data.contextRows.map((row) => <tr key={row.teamId} className={row.teamId === data.home?.teamId || row.teamId === data.away?.teamId ? "selected" : ""}><td>{row.rank}</td><td><TeamLogo src={row.teamLogo} alt={row.teamName} size={28} /><strong>{row.teamName}</strong></td><td>{row.all.played}</td><td>{row.all.win}</td><td>{row.all.draw}</td><td>{row.all.lose}</td><td>{row.all.goals.for}:{row.all.goals.against}</td><td>{row.goalsDiff}</td><td><b>{row.points}</b></td><td>{row.form || "—"}</td></tr>)}</tbody></table></div>
      <div className="grid gap-4 lg:grid-cols-2"><section className="football-panel"><h3>{data.home.teamName} u siebie</h3><p>{standingRecord(data.home, "home")?.win} wygranych, {standingRecord(data.home, "home")?.draw} remisów, {standingRecord(data.home, "home")?.lose} porażek w {standingRecord(data.home, "home")?.played} meczach.</p></section><section className="football-panel"><h3>{data.away.teamName} na wyjeździe</h3><p>{standingRecord(data.away, "away")?.win} wygranych, {standingRecord(data.away, "away")?.draw} remisów, {standingRecord(data.away, "away")?.lose} porażek w {standingRecord(data.away, "away")?.played} meczach.</p></section></div>
    </div>
  );
}

function MetricsTab({ snapshot, kind, override }: { snapshot: FootballAnalysisSnapshot; kind: "goals" | "corners" | "cards" | "shots"; override?: string }) {
  const home = snapshot.venueSplits.homeTeamAtHome;
  const away = snapshot.venueSplits.awayTeamAway;
  const h = home.summary.averages;
  const a = away.summary.averages;
  const title = kind === "goals" ? "Gole i połowy" : kind === "corners" ? "Rzuty rożne" : kind === "cards" ? "Kartki i faule" : "Strzały";
  const rows = kind === "goals" ? [
    ["Gole zdobyte", h.goalsFor, a.goalsFor], ["Gole stracone", h.goalsAgainst, a.goalsAgainst], ["xG", h.xgFor, a.xgFor], ["xG rywali", h.xgAgainst, a.xgAgainst], ["Gole 1. połowa", h.halftimeGoalsFor, a.halftimeGoalsFor], ["Gole 2. połowa", h.secondHalfGoalsFor, a.secondHalfGoalsFor],
  ] as const : kind === "corners" ? [
    ["Rożne wywalczone", h.cornersFor, a.cornersFor], ["Rożne oddane rywalom", h.cornersAgainst, a.cornersAgainst],
  ] as const : kind === "cards" ? [
    ["Żółte kartki", h.yellowCardsFor, a.yellowCardsFor], ["Czerwone kartki", h.redCardsFor, a.redCardsFor], ["Łączne kartki", h.cardsFor, a.cardsFor], ["Kartki rywali", h.cardsAgainst, a.cardsAgainst], ["Faule", h.foulsFor, a.foulsFor],
  ] as const : [
    ["Wszystkie strzały", h.shotsFor, a.shotsFor], ["Strzały rywali", h.shotsAgainst, a.shotsAgainst], ["Celne", h.shotsOnTargetFor, a.shotsOnTargetFor], ["Celne rywali", h.shotsOnTargetAgainst, a.shotsOnTargetAgainst], ["Niecelne", h.shotsOffTargetFor, a.shotsOffTargetFor], ["Zablokowane", h.blockedShotsFor, a.blockedShotsFor], ["Z pola karnego", h.shotsInsideBoxFor, a.shotsInsideBoxFor], ["Spoza pola karnego", h.shotsOutsideBoxFor, a.shotsOutsideBoxFor], ["Interwencje bramkarza", h.goalkeeperSavesFor, a.goalkeeperSavesFor],
  ] as const;
  const additional = [...home.matches, ...away.matches].flatMap((match) => match.additionalStatistics.team);
  return (
    <div className="space-y-5">
      <ManualOverride title={title} text={override} />
      <section className="football-panel"><h3>{title} · dom kontra wyjazd</h3>{rows.map(([label, homeValue, awayValue]) => <Pair key={label} label={label} home={homeValue} away={awayValue} homeName={snapshot.fixture.homeTeam.name} awayName={snapshot.fixture.awayTeam.name} />)}</section>
      {kind === "corners" && <div className="football-summary-grid"><Stat label={`${snapshot.fixture.homeTeam.name} · over 8,5`} value={`${home.summary.cornersOver85}/${home.summary.sampleSize}`} note="łączna liczba rożnych" /><Stat label={`${snapshot.fixture.homeTeam.name} · over 9,5`} value={`${home.summary.cornersOver95}/${home.summary.sampleSize}`} /><Stat label={`${snapshot.fixture.awayTeam.name} · over 8,5`} value={`${away.summary.cornersOver85}/${away.summary.sampleSize}`} /><Stat label={`${snapshot.fixture.awayTeam.name} · over 10,5`} value={`${away.summary.cornersOver105}/${away.summary.sampleSize}`} /></div>}
      {kind === "goals" && <div className="football-summary-grid"><Stat label={`${snapshot.fixture.homeTeam.name} · prowadzenie po pierwszym golu`} value={`${home.summary.scoredFirst}/${home.summary.sampleSize}`} /><Stat label={`${snapshot.fixture.homeTeam.name} · stracony pierwszy gol`} value={`${home.summary.concededFirst}/${home.summary.sampleSize}`} /><Stat label={`${snapshot.fixture.awayTeam.name} · zdobyty pierwszy gol`} value={`${away.summary.scoredFirst}/${away.summary.sampleSize}`} /><Stat label={`${snapshot.fixture.awayTeam.name} · stracony pierwszy gol`} value={`${away.summary.concededFirst}/${away.summary.sampleSize}`} /></div>}
      {additional.length > 0 && <section className="football-panel"><h3>Pozostałe statystyki</h3><p>API-Football zwróciło dodatkowe rodzaje danych, których aplikacja nie usuwa:</p><div className="football-summary-grid">{additional.slice(0, 12).map((stat, index) => <Stat key={`${stat.key}-${index}`} label={stat.label} value={stat.value === null ? String(stat.rawValue ?? "—") : value(stat.value)} note="wartość z pojedynczego meczu" />)}</div></section>}
    </div>
  );
}

function H2HTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  const h2h = snapshot.h2h;
  if (!h2h?.matches.length) return <><ManualOverride title="H2H" text={override} /><SectionMessage>{h2h?.reason || "API-Football nie zwróciło bezpośrednich spotkań tych drużyn."}</SectionMessage></>;
  return <div className="space-y-5"><ManualOverride title="H2H" text={override} /><div className="football-summary-grid"><Stat label={`Wygrane ${snapshot.fixture.homeTeam.name}`} value={h2h.homeWins} note={`${h2h.matches.length} meczów`} /><Stat label="Remisy" value={h2h.draws} /><Stat label={`Wygrane ${snapshot.fixture.awayTeam.name}`} value={h2h.awayWins} /><Stat label="Średnia goli" value={value(h2h.averageGoals)} /><Stat label="BTTS" value={`${h2h.bttsCount}/${h2h.matches.length}`} /><Stat label="Powyżej 2,5" value={`${h2h.over25Count}/${h2h.matches.length}`} /></div>{h2h.olderThanTwoSeasons > 0 && <SectionMessage>{h2h.olderThanTwoSeasons} z tych spotkań pochodzi sprzed ponad dwóch sezonów i powinno mieć niższą wagę niż aktualna forma.</SectionMessage>}<div className="recent-match-list">{h2h.matches.map((match) => <article key={match.fixtureId} className="recent-match-card"><p>{date(match.date)}</p><div className="recent-score-line"><TeamLogo src={match.homeTeam.logo} alt={match.homeTeam.name} size={30} /><strong>{match.homeTeam.name} {value(match.homeGoals, "", 0)}:{value(match.awayGoals, "", 0)} {match.awayTeam.name}</strong><TeamLogo src={match.awayTeam.logo} alt={match.awayTeam.name} size={30} /></div><div className="recent-match-stats"><span>Do przerwy <b>{value(match.halftimeHomeGoals, "", 0)}:{value(match.halftimeAwayGoals, "", 0)}</b></span><span>BTTS <b>{match.btts === null ? "—" : match.btts ? "tak" : "nie"}</b></span><span>Over 2,5 <b>{match.over25 === null ? "—" : match.over25 ? "tak" : "nie"}</b></span><span>Rożne <b>{value(match.totalCorners, "", 0)}</b></span><span>Kartki <b>{value(match.totalCards, "", 0)}</b></span><span>Strzały <b>{value(match.totalShots, "", 0)}</b></span></div></article>)}</div></div>;
}

function lineupTeam(team: MatchLineupsData["teams"][number]) {
  return <section key={team.teamId} className="football-team-section"><div className="football-team-title"><TeamLogo src={team.teamLogo} alt={team.teamName} size={48} /><div><h3>{team.teamName}</h3><p>{team.formation || "ustawienie niepodane"}</p></div></div>{team.coachName && <div className="person-row"><PersonPhoto src={team.coachPhoto} alt={team.coachName} size={48} /><div><strong>{team.coachName}</strong><small>Trener</small></div></div>}<h4>Podstawowa jedenastka</h4><div className="lineup-grid">{team.startXI.map((player) => <div key={player.id || player.name} className="person-row"><PersonPhoto src={player.playerPhoto} alt={player.name} size={42} /><div><strong>{player.name}{player.captain ? " (C)" : ""}</strong><small>{player.position || "pozycja niepodana"}{player.number ? ` · #${player.number}` : ""}</small></div></div>)}</div><h4>Rezerwowi</h4><div className="lineup-grid compact">{team.substitutes.map((player) => <div key={player.id || player.name} className="person-row"><PersonPhoto src={player.playerPhoto} alt={player.name} size={36} /><div><strong>{player.name}</strong><small>{player.position || "pozycja niepodana"}</small></div></div>)}</div></section>;
}

function LineupsTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  const { lineups, injuries } = snapshot;
  const injuriesList = [...injuries.missing, ...injuries.questionable];
  return <div className="space-y-5"><ManualOverride title="Składy" text={override} />{lineups.official ? <div className="grid gap-4 lg:grid-cols-2">{lineups.teams.map(lineupTeam)}</div> : <SectionMessage>{lineups.reason || "Oficjalne składy nie zostały jeszcze opublikowane."}</SectionMessage>}<section className="football-panel"><h3>Najczęściej rozpoczynający ostatnie mecze</h3><p>Wzorzec historyczny — nie jest to przewidywany ani oficjalny skład.</p><div className="grid gap-4 lg:grid-cols-2">{lineups.historicalStarters.map((team) => <div key={team.teamId}><h4>{team.teamName}</h4><ul className="football-list">{team.players.map((player) => <li key={player.playerId}><span>{player.playerName}</span><strong>{player.starts}/{player.sampleSize} startów</strong></li>)}</ul></div>)}</div></section><section className="football-panel"><h3>Absencje</h3>{injuries.reason && !injuriesList.length ? <SectionMessage>{injuries.reason}</SectionMessage> : <div className="lineup-grid">{injuriesList.map((injury) => <div key={`${injury.teamId}-${injury.playerId}-${injury.playerName}`} className="person-row"><PersonPhoto src={injury.playerPhoto} alt={injury.playerName} size={48} /><div><strong>{injury.playerName}</strong><small>{injury.teamName} · {injury.type === "missing" ? "Nieobecny" : "Wątpliwy"}</small><small>{injury.reason || "przyczyna niepodana"}</small>{injury.regularity && <small>{injury.regularity}</small>}</div></div>)}</div>}</section></div>;
}

function playerCard(player: PlayerInsight) {
  return <article key={player.playerId} className="player-card"><PersonPhoto src={player.playerPhoto} alt={player.playerName} size={62} /><div><h4>{player.playerName}</h4><p>{player.position || "Pozycja niepodana"}</p>{player.playerNationality && <CountryLabel code={player.countryCode} name={player.playerNationality} />}</div><div className="player-metrics"><span>Minuty <b>{value(player.minutes)}</b></span><span>Ocena <b>{value(player.averageRating, "", 2)}</b></span><span>Gole <b>{value(player.goals)}</b></span><span>Asysty <b>{value(player.assists)}</b></span><span>Strzały <b>{value(player.shots)}</b></span><span>Celne <b>{value(player.shotsOnTarget)}</b></span><span>Kluczowe podania <b>{value(player.keyPasses)}</b></span><span>Odbiory <b>{value(player.tackles)}</b></span></div><small>Próba: {player.appearances} spotkań. {player.appearances < 3 ? "Mała próba — wynik może być niestabilny." : ""}</small></article>;
}

function PlayersTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const data = snapshot.playerInsights;
  if (!data.home.length && !data.away.length) return <SectionMessage>{data.reason || "API-Football nie zwróciło statystyk zawodników w analizowanej próbce."}</SectionMessage>;
  return <div className="grid gap-5 lg:grid-cols-2"><section className="football-team-section"><div className="football-team-title"><TeamLogo src={snapshot.fixture.homeTeam.logo} alt={snapshot.fixture.homeTeam.name} size={48} /><h3>{snapshot.fixture.homeTeam.name}</h3></div><div className="player-list">{data.home.map(playerCard)}</div></section><section className="football-team-section"><div className="football-team-title"><TeamLogo src={snapshot.fixture.awayTeam.logo} alt={snapshot.fixture.awayTeam.name} size={48} /><h3>{snapshot.fixture.awayTeam.name}</h3></div><div className="player-list">{data.away.map(playerCard)}</div></section></div>;
}

function SignalsTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  return <div className="space-y-5"><ManualOverride title="Zaawansowane ryzyko" text={override} /><section className="football-panel"><h3>Kluczowe sygnały</h3><div className="signal-list">{snapshot.signals.map((signal) => <article key={signal.id} className={`signal-card signal-${signal.strength}`}><div><span>{signal.category}</span><small>{signal.confidence}%</small></div><h4>{signal.title}</h4><p>{signal.evidence}</p><p>{signal.interpretation}</p><small>{signal.coverage}</small></article>)}</div>{!snapshot.signals.length && <SectionMessage>Nie wygenerowano sygnału, ponieważ wymagane dane obu drużyn nie są jednocześnie dostępne.</SectionMessage>}</section><section className="football-panel"><h3>Ryzyka tej analizy</h3><div className="risk-list">{snapshot.risks.map((risk) => <article key={risk.id} className={`match-risk risk-${risk.level}`}><span>{risk.level === "high" ? "Wysokie" : risk.level === "medium" ? "Średnie" : "Niskie"}</span><h4>{risk.title}</h4><p>{risk.evidence}</p><small>{risk.impact}</small></article>)}</div>{!snapshot.risks.length && <SectionMessage>W dostępnych danych nie wykryto konkretnego ryzyka liczbowego; nie oznacza to braku niepewności sportowej.</SectionMessage>}</section></div>;
}

function OddsTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const odds = snapshot.odds;
  return <div className="space-y-5"><SectionMessage>Kursy API-Football są źródłem opcjonalnym. Kursy wpisane ręcznie w Studio mają pierwszeństwo i nie są automatycznie nadpisywane.</SectionMessage>{odds ? <section className="football-panel"><h3>{odds.bookmaker || "Dostawca kursów"}</h3><p>Aktualizacja: {odds.updatedAt ? date(odds.updatedAt) : "czas niepodany"}</p><div className="odds-market-grid">{odds.markets.slice(0, 12).map((market) => <article key={`${market.id}-${market.name}`}><strong>{market.name}</strong>{market.values.map((item) => <div key={item.label}><span>{item.label}</span><b>{value(item.odd, "", 2)}</b></div>)}</article>)}</div></section> : <SectionMessage>API-Football nie zwróciło kursów przedmeczowych dla tego spotkania. Dostępność zależy od ligi, bukmachera i czasu do pierwszego gwizdka.</SectionMessage>}</div>;
}

function QualityTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  return <div className="space-y-5"><section className="football-panel"><h3>Kompletność sekcji</h3><div className="coverage-grid">{Object.entries(snapshot.coverage).map(([key, section]) => <article key={key} className={`coverage-card coverage-${section.status}`}><span>{section.status}</span><h4>{key}</h4><strong>{section.samples} rekordów / próbek</strong><p>{section.message}</p></article>)}</div></section><section className="football-panel"><h3>Zapytania importu</h3><p>{snapshot.requestSummary.totalRequests} logicznych wywołań providera · limit równoległości {snapshot.requestSummary.concurrencyLimit}. Odpowiedzi z cache nie zużywają kolejnego limitu API.</p><p>{snapshot.requestSummary.cacheStrategy}</p><div className="football-table-scroll"><table className="football-table"><thead><tr><th>Endpoint</th><th>Status</th><th>Wywołania</th><th>Informacja</th></tr></thead><tbody>{snapshot.requestSummary.endpoints.map((item) => <tr key={item.endpoint}><td><code>{item.endpoint}</code></td><td>{item.status}</td><td>{item.requests}</td><td>{item.message}</td></tr>)}</tbody></table></div></section>{snapshot.warnings.length > 0 && <section className="football-panel"><h3>Ostrzeżenia</h3><ul className="football-list">{snapshot.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>}<p className="text-xs text-slate-500">Snapshot znormalizowanych danych: wersja {snapshot.version} · pobrano {date(snapshot.fetchedAt)} · źródło API-Football.</p></div>;
}

export function FootballReportTabs({ snapshot, mode, summary, premiumSections }: { snapshot: FootballAnalysisSnapshot; mode: "free" | "premium"; summary: string; premiumSections: PremiumSections }) {
  const [active, setActive] = useState<TabKey>("summary");
  const tab = tabs.find((item) => item.key === active) || tabs[0];
  const locked = tab.premium && mode !== "premium";
  let content: ReactNode;
  switch (active) {
    case "summary": content = <SummaryTab snapshot={snapshot} summary={summary} />; break;
    case "recent": content = <div className="grid gap-5 xl:grid-cols-2"><RecentTeam data={snapshot.recentForm.home} place="ostatnie mecze ogółem" /><RecentTeam data={snapshot.recentForm.away} place="ostatnie mecze ogółem" /></div>; break;
    case "venue": content = <VenueTab snapshot={snapshot} />; break;
    case "standings": content = <StandingsTab data={snapshot.standings} />; break;
    case "goals": content = <MetricsTab snapshot={snapshot} kind="goals" override={premiumSections.halvesAnalysis} />; break;
    case "corners": content = <MetricsTab snapshot={snapshot} kind="corners" override={premiumSections.cornersAnalysis} />; break;
    case "cards": content = <MetricsTab snapshot={snapshot} kind="cards" override={premiumSections.cardsAnalysis} />; break;
    case "shots": content = <MetricsTab snapshot={snapshot} kind="shots" override={premiumSections.shotsAnalysis} />; break;
    case "h2h": content = <H2HTab snapshot={snapshot} override={premiumSections.h2hAdvanced} />; break;
    case "lineups": content = <LineupsTab snapshot={snapshot} override={premiumSections.lineupsAdvanced} />; break;
    case "players": content = <PlayersTab snapshot={snapshot} />; break;
    case "signals": content = <SignalsTab snapshot={snapshot} override={premiumSections.advancedRisk} />; break;
    case "odds": content = <OddsTab snapshot={snapshot} />; break;
    case "quality": content = <QualityTab snapshot={snapshot} />; break;
  }
  return (
    <section className="football-report-tabs">
      <nav className="football-tab-list" aria-label="Sekcje raportu">{tabs.map((item) => <button key={item.key} type="button" className={active === item.key ? "active" : ""} onClick={() => setActive(item.key)} aria-current={active === item.key ? "page" : undefined}>{item.label}{item.premium && <span aria-label="Premium">P</span>}</button>)}</nav>
      <div className="football-tab-panel">{locked ? <PremiumLockCard title={tab.label} text="Zmień tryb podglądu na Premium, aby zobaczyć strukturalną sekcję z liczbami, próbką i konkretnymi wnioskami." /> : content}</div>
    </section>
  );
}
