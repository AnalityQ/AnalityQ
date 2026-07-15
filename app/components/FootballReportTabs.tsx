"use client";

import { useState, type ReactNode } from "react";
import {
  localizeCompetitionName,
  localizePlayerPosition,
  localizePublicText,
  localizeTeamName,
  teamGenitive,
} from "@/lib/countries";
import type {
  FootballAnalysisSnapshot,
  MatchStandingsData,
  NormalizedTeamMatchStats,
  PlayerInsight,
  TeamRecentData,
  TeamSampleSummary,
} from "@/lib/football-api/types";
import type { PremiumSections } from "@/lib/types";
import { CountryLabel, LeagueLogo, PersonPhoto, TeamLogo } from "./ApiImage";
import { FootballIcon, type FootballIconName } from "./FootballIcon";
import { PremiumLockCard } from "./PremiumLockCard";
import { TacticalLineups } from "./TacticalLineups";

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
  | "absences"
  | "signals"
  | "risks"
  | "odds"
  | "quality";

const tabs: Array<{ key: TabKey; label: string; premium: boolean; icon: FootballIconName }> = [
  { key: "summary", label: "Przegląd", premium: false, icon: "signals" },
  { key: "recent", label: "Ostatnie 5", premium: false, icon: "form" },
  { key: "venue", label: "Dom / wyjazd", premium: false, icon: "h2h" },
  { key: "standings", label: "Tabela", premium: false, icon: "standings" },
  { key: "goals", label: "Gole i połowy", premium: true, icon: "goals" },
  { key: "corners", label: "Rzuty rożne", premium: true, icon: "corners" },
  { key: "cards", label: "Kartki i faule", premium: true, icon: "cards" },
  { key: "shots", label: "Strzały", premium: true, icon: "shots" },
  { key: "h2h", label: "H2H", premium: true, icon: "h2h" },
  { key: "lineups", label: "Składy", premium: false, icon: "lineups" },
  { key: "players", label: "Zawodnicy", premium: true, icon: "players" },
  { key: "absences", label: "Absencje", premium: false, icon: "absences" },
  { key: "signals", label: "Sygnały", premium: false, icon: "signals" },
  { key: "risks", label: "Ryzyko", premium: false, icon: "risk" },
  { key: "odds", label: "Kursy", premium: false, icon: "value" },
  { key: "quality", label: "Jakość danych", premium: false, icon: "value" },
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

function publicMessage(message: string | null | undefined, fallback: string) {
  return localizePublicText((message || fallback)
    .replaceAll("API-Football", "Źródło danych")
    .replaceAll("Dostawca", "Źródło danych")
    .replaceAll("providera", "dostawcy danych")
    .replaceAll("provider", "dostawca danych")
    .replaceAll("endpoint", "zakres danych")
    .replaceAll("cache", "pamięć podręczna"));
}

function additionalStatisticLabel(key: string, fallback: string) {
  const labels: Record<string, string> = {
    goalsprevented: "Zapobieżone gole",
    bigchances: "Duże okazje",
    bigchancesmissed: "Niewykorzystane duże okazje",
    hitwoodwork: "Strzały w obramowanie bramki",
    counterattacks: "Kontrataki",
    counterattackshots: "Strzały po kontratakach",
    counterattackgoals: "Gole po kontratakach",
  };
  return labels[key] || fallback.replaceAll("_", " ");
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
  const homeName = localizeTeamName(match.isHome ? teamName : match.opponentName);
  const awayName = localizeTeamName(match.isHome ? match.opponentName : teamName);
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
  const teamName = localizeTeamName(data.team.name);
  return (
    <section className="football-team-section">
      <div className="football-team-title"><TeamLogo src={data.team.logo} alt={teamName} size={48} /><div><h3>{teamName}</h3><p>{data.summary.sampleSize} spotkań · {place}</p></div></div>
      <SummaryGrid summary={data.summary} place={place} />
      <div className="recent-match-list">
        {data.matches.map((match) => <MatchCard key={match.fixtureId} match={match} teamName={teamName} />)}
      </div>
      {!data.matches.length && <SectionMessage>Brak zakończonych meczów zespołu {teamName} przed analizowanym spotkaniem.</SectionMessage>}
    </section>
  );
}

function ManualOverride({ title, text }: { title: string; text?: string }) {
  if (!text?.trim()) return null;
  return <aside className="manual-override"><strong>{title} — korekta administratora</strong><p>{text}</p></aside>;
}

function SummaryTab({ snapshot, summary }: { snapshot: FootballAnalysisSnapshot; summary: string }) {
  const homeName = localizeTeamName(snapshot.fixture.homeTeam.name);
  const awayName = localizeTeamName(snapshot.fixture.awayTeam.name);
  return (
    <div className="space-y-5">
      <section className="football-narrative"><p className="eyebrow">Raport dla tego meczu</p><p>{publicMessage(summary || snapshot.automaticSummary, "Raport zawiera zbyt mało danych, aby utworzyć liczbowe podsumowanie bez uogólnień.")}</p></section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="football-panel"><h3>Forma w miejscu meczu</h3><Pair label="Punkty w próbce" home={snapshot.venueSplits.homeTeamAtHome.summary.points} away={snapshot.venueSplits.awayTeamAway.summary.points} homeName={homeName} awayName={awayName} /><Pair label="Średnie gole" home={snapshot.venueSplits.homeTeamAtHome.summary.averages.goalsFor} away={snapshot.venueSplits.awayTeamAway.summary.averages.goalsFor} homeName={homeName} awayName={awayName} /><Pair label="Średnie strzały" home={snapshot.venueSplits.homeTeamAtHome.summary.averages.shotsFor} away={snapshot.venueSplits.awayTeamAway.summary.averages.shotsFor} homeName={homeName} awayName={awayName} /></section>
        <section className="football-panel"><h3>Najważniejsze sygnały</h3><div className="signal-list">{snapshot.signals.slice(0, 4).map((signal) => <article key={signal.id} className={`signal-card signal-${signal.strength}`}><div><span>{signal.strength === "strong" ? "Silny" : signal.strength === "medium" ? "Średni" : "Słaby"}</span><small>{signal.confidence}% pewności</small></div><h4>{localizePublicText(signal.title)}</h4><p>{localizePublicText(signal.evidence)}</p><small>{localizePublicText(signal.coverage)}</small></article>)}</div>{!snapshot.signals.length && <SectionMessage>Brakuje wspólnego zestawu liczb obu drużyn wymaganego do wygenerowania konkretnego sygnału.</SectionMessage>}</section>
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
      <section className="football-panel"><h3>Atak a liczby dopuszczane przez przeciwnika</h3><Pair label="Gole: atak / defensywa rywala" home={home.summary.averages.goalsFor} away={away.summary.averages.goalsAgainst} homeName={localizeTeamName(snapshot.fixture.homeTeam.name)} awayName={localizeTeamName(snapshot.fixture.awayTeam.name)} /><Pair label="Strzały: atak / defensywa rywala" home={home.summary.averages.shotsFor} away={away.summary.averages.shotsAgainst} homeName={localizeTeamName(snapshot.fixture.homeTeam.name)} awayName={localizeTeamName(snapshot.fixture.awayTeam.name)} /><Pair label="Rożne: wywalczone / oddane" home={home.summary.averages.cornersFor} away={away.summary.averages.cornersAgainst} homeName={localizeTeamName(snapshot.fixture.homeTeam.name)} awayName={localizeTeamName(snapshot.fixture.awayTeam.name)} /></section>
    </div>
  );
}

function standingRecord(record: MatchStandingsData["home"] extends infer U ? U : never, place: "home" | "away") {
  return record?.[place];
}

function StandingsTab({ data }: { data: MatchStandingsData | null }) {
  if (!data?.available || !data.home || !data.away) return <SectionMessage>{publicMessage(data?.reason, "Brak tabeli dla tych rozgrywek.")}</SectionMessage>;
  const homeName = localizeTeamName(data.home.teamName);
  const awayName = localizeTeamName(data.away.teamName);
  return (
    <div className="space-y-5">
      <div className="football-league-heading"><LeagueLogo src={data.leagueLogo} alt={localizeCompetitionName(data.leagueName)} size={54} /><div><h3>{localizeCompetitionName(data.leagueName)}</h3><CountryLabel code={data.countryCode} name={data.countryName} /></div></div>
      <div className="football-summary-grid"><Stat label="Różnica miejsc" value={data.rankDifference} note={`${homeName}: ${data.home.rank}. · ${awayName}: ${data.away.rank}.`} /><Stat label="Różnica punktów" value={Math.abs(data.pointsDifference || 0)} note={`${data.home.points}–${data.away.points} pkt`} /><Stat label={`${homeName} · bilans`} value={`${data.home.all.win}–${data.home.all.draw}–${data.home.all.lose}`} note={`${data.home.all.goals.for}:${data.home.all.goals.against} w bramkach`} /><Stat label={`${awayName} · bilans`} value={`${data.away.all.win}–${data.away.all.draw}–${data.away.all.lose}`} note={`${data.away.all.goals.for}:${data.away.all.goals.against} w bramkach`} /></div>
      <div className="football-table-scroll"><table className="football-table"><thead><tr><th>M.</th><th>Drużyna</th><th>M</th><th>W</th><th>R</th><th>P</th><th>Bramki</th><th>+/-</th><th>Pkt</th><th>Forma</th></tr></thead><tbody>{data.contextRows.map((row) => <tr key={row.teamId} className={row.teamId === data.home?.teamId || row.teamId === data.away?.teamId ? "selected" : ""}><td>{row.rank}</td><td><TeamLogo src={row.teamLogo} alt={localizeTeamName(row.teamName)} size={28} /><strong>{localizeTeamName(row.teamName)}</strong></td><td>{row.all.played}</td><td>{row.all.win}</td><td>{row.all.draw}</td><td>{row.all.lose}</td><td>{row.all.goals.for}:{row.all.goals.against}</td><td>{row.goalsDiff}</td><td><b>{row.points}</b></td><td>{row.form || "—"}</td></tr>)}</tbody></table></div>
      <div className="grid gap-4 lg:grid-cols-2"><section className="football-panel"><h3>{homeName} u siebie</h3><p>{standingRecord(data.home, "home")?.win} wygranych, {standingRecord(data.home, "home")?.draw} remisów, {standingRecord(data.home, "home")?.lose} porażek w {standingRecord(data.home, "home")?.played} meczach.</p></section><section className="football-panel"><h3>{awayName} na wyjeździe</h3><p>{standingRecord(data.away, "away")?.win} wygranych, {standingRecord(data.away, "away")?.draw} remisów, {standingRecord(data.away, "away")?.lose} porażek w {standingRecord(data.away, "away")?.played} meczach.</p></section></div>
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
  const homeName = localizeTeamName(snapshot.fixture.homeTeam.name);
  const awayName = localizeTeamName(snapshot.fixture.awayTeam.name);
  return (
    <div className="space-y-5">
      <ManualOverride title={title} text={override} />
      <section className="football-panel"><h3>{title} · dom kontra wyjazd</h3>{rows.map(([label, homeValue, awayValue]) => <Pair key={label} label={label} home={homeValue} away={awayValue} homeName={homeName} awayName={awayName} />)}</section>
      {kind === "corners" && <div className="football-summary-grid"><Stat label={`${homeName} · ponad 8,5`} value={`${home.summary.cornersOver85}/${home.summary.sampleSize}`} note="łączna liczba rożnych" /><Stat label={`${homeName} · ponad 9,5`} value={`${home.summary.cornersOver95}/${home.summary.sampleSize}`} /><Stat label={`${awayName} · ponad 8,5`} value={`${away.summary.cornersOver85}/${away.summary.sampleSize}`} /><Stat label={`${awayName} · ponad 10,5`} value={`${away.summary.cornersOver105}/${away.summary.sampleSize}`} /></div>}
      {kind === "goals" && <div className="football-summary-grid"><Stat label={`${homeName} · prowadzenie po pierwszym golu`} value={`${home.summary.scoredFirst}/${home.summary.sampleSize}`} /><Stat label={`${homeName} · stracony pierwszy gol`} value={`${home.summary.concededFirst}/${home.summary.sampleSize}`} /><Stat label={`${awayName} · zdobyty pierwszy gol`} value={`${away.summary.scoredFirst}/${away.summary.sampleSize}`} /><Stat label={`${awayName} · stracony pierwszy gol`} value={`${away.summary.concededFirst}/${away.summary.sampleSize}`} /></div>}
      {additional.length > 0 && <section className="football-panel"><h3>Pozostałe statystyki</h3><p>Dla części spotkań dostępne są dodatkowe rodzaje danych:</p><div className="football-summary-grid">{additional.slice(0, 12).map((stat, index) => <Stat key={`${stat.key}-${index}`} label={additionalStatisticLabel(stat.key, stat.label)} value={stat.value === null ? String(stat.rawValue ?? "—") : value(stat.value)} note="wartość z pojedynczego meczu" />)}</div></section>}
    </div>
  );
}

function H2HTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  const h2h = snapshot.h2h;
  if (!h2h?.matches.length) return <><ManualOverride title="H2H" text={override} /><SectionMessage>{publicMessage(h2h?.reason, "Brak bezpośrednich spotkań tych drużyn.")}</SectionMessage></>;
  return <div className="space-y-5"><ManualOverride title="H2H" text={override} /><div className="football-summary-grid"><Stat label={`Wygrane ${teamGenitive(snapshot.fixture.homeTeam.name)}`} value={h2h.homeWins} note={`${h2h.matches.length} meczów`} /><Stat label="Remisy" value={h2h.draws} /><Stat label={`Wygrane ${teamGenitive(snapshot.fixture.awayTeam.name)}`} value={h2h.awayWins} /><Stat label="Średnia goli" value={value(h2h.averageGoals)} /><Stat label="BTTS" value={`${h2h.bttsCount}/${h2h.matches.length}`} /><Stat label="Powyżej 2,5" value={`${h2h.over25Count}/${h2h.matches.length}`} /></div>{h2h.olderThanTwoSeasons > 0 && <SectionMessage>{h2h.olderThanTwoSeasons} z tych spotkań pochodzi sprzed ponad dwóch sezonów i powinno mieć niższą wagę niż aktualna forma.</SectionMessage>}<div className="recent-match-list h2h-timeline">{h2h.matches.map((match) => { const homeName = localizeTeamName(match.homeTeam.name); const awayName = localizeTeamName(match.awayTeam.name); return <article key={match.fixtureId} className="recent-match-card"><p>{date(match.date)}</p><div className="recent-score-line"><TeamLogo src={match.homeTeam.logo} alt={homeName} size={30} /><strong>{homeName} {value(match.homeGoals, "", 0)}:{value(match.awayGoals, "", 0)} {awayName}</strong><TeamLogo src={match.awayTeam.logo} alt={awayName} size={30} /></div><div className="recent-match-stats"><span>Do przerwy <b>{value(match.halftimeHomeGoals, "", 0)}:{value(match.halftimeAwayGoals, "", 0)}</b></span><span>BTTS <b>{match.btts === null ? "—" : match.btts ? "tak" : "nie"}</b></span><span>Powyżej 2,5 <b>{match.over25 === null ? "—" : match.over25 ? "tak" : "nie"}</b></span><span>Rożne <b>{value(match.totalCorners, "", 0)}</b></span><span>Kartki <b>{value(match.totalCards, "", 0)}</b></span><span>Strzały <b>{value(match.totalShots, "", 0)}</b></span></div></article>; })}</div></div>;
}

function LineupsTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  return <div className="space-y-5"><ManualOverride title="Składy" text={override} /><TacticalLineups snapshot={snapshot} /></div>;
}

function playerCard(player: PlayerInsight) {
  return <article key={player.playerId} className="player-card"><PersonPhoto src={player.playerPhoto} alt={player.playerName} size={62} /><div><h4>{player.playerName}</h4><p>{localizePlayerPosition(player.position) || "Pozycja niepodana"}</p>{player.playerNationality && <CountryLabel code={player.countryCode} name={player.playerNationality} />}</div><div className="player-metrics"><span>Minuty <b>{value(player.minutes)}</b></span><span>Ocena <b>{value(player.averageRating, "", 2)}</b></span><span>Gole <b>{value(player.goals)}</b></span><span>Asysty <b>{value(player.assists)}</b></span><span>Strzały <b>{value(player.shots)}</b></span><span>Celne <b>{value(player.shotsOnTarget)}</b></span><span>Kluczowe podania <b>{value(player.keyPasses)}</b></span><span>Odbiory <b>{value(player.tackles)}</b></span></div><small>Próba: {player.appearances} spotkań. {player.appearances < 3 ? "Mała próba — wynik może być niestabilny." : ""}</small></article>;
}

function PlayersTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const data = snapshot.playerInsights;
  if (!data.home.length && !data.away.length) return <SectionMessage>{publicMessage(data.reason, "Brak statystyk zawodników w analizowanej próbce.")}</SectionMessage>;
  return <div className="grid gap-5 lg:grid-cols-2"><section className="football-team-section"><div className="football-team-title"><TeamLogo src={snapshot.fixture.homeTeam.logo} alt={localizeTeamName(snapshot.fixture.homeTeam.name)} size={48} /><h3>{localizeTeamName(snapshot.fixture.homeTeam.name)}</h3></div><div className="player-list">{data.home.map(playerCard)}</div></section><section className="football-team-section"><div className="football-team-title"><TeamLogo src={snapshot.fixture.awayTeam.logo} alt={localizeTeamName(snapshot.fixture.awayTeam.name)} size={48} /><h3>{localizeTeamName(snapshot.fixture.awayTeam.name)}</h3></div><div className="player-list">{data.away.map(playerCard)}</div></section></div>;
}

function SignalsTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  return <div className="space-y-5"><ManualOverride title="Sygnały" text={override} /><section className="football-panel"><h3>Kluczowe sygnały</h3><div className="signal-list">{snapshot.signals.map((signal) => <article key={signal.id} className={`signal-card signal-${signal.strength}`}><div><span>{signal.category}</span><small>{signal.confidence}%</small></div><h4>{localizePublicText(signal.title)}</h4><p>{localizePublicText(signal.evidence)}</p><p>{localizePublicText(signal.interpretation)}</p><small>{localizePublicText(signal.coverage)}</small></article>)}</div>{!snapshot.signals.length && <SectionMessage>Nie wygenerowano sygnału, ponieważ wymagane dane obu drużyn nie są jednocześnie dostępne.</SectionMessage>}</section></div>;
}

function RisksTab({ snapshot, override }: { snapshot: FootballAnalysisSnapshot; override?: string }) {
  return <div className="space-y-5"><ManualOverride title="Zaawansowane ryzyko" text={override} /><section className="football-panel"><h3>Ryzyka tej analizy</h3><div className="risk-list">{snapshot.risks.map((risk) => <article key={risk.id} className={`match-risk risk-${risk.level}`}><span>{risk.level === "high" ? "Wysokie" : risk.level === "medium" ? "Średnie" : "Niskie"}</span><h4>{localizePublicText(risk.title)}</h4><p>{localizePublicText(risk.evidence)}</p><small>{localizePublicText(risk.impact)}</small></article>)}</div>{!snapshot.risks.length && <SectionMessage>W dostępnych danych nie wykryto konkretnego ryzyka liczbowego; nie oznacza to braku niepewności sportowej.</SectionMessage>}</section></div>;
}

function AbsencesTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const injuries = [...snapshot.injuries.missing, ...snapshot.injuries.questionable];
  if (!injuries.length) return <SectionMessage>{publicMessage(snapshot.injuries.reason, "Brak potwierdzonych absencji w dostępnych danych.")}</SectionMessage>;
  return <div className="grid gap-4 lg:grid-cols-2">{[snapshot.fixture.homeTeam, snapshot.fixture.awayTeam].map((team) => { const teamName = localizeTeamName(team.name); return <section key={team.id} className="football-team-section"><div className="football-team-title"><TeamLogo src={team.logo} alt={teamName} size={48} /><h3>{teamName}</h3></div><div className="player-list">{injuries.filter((injury) => injury.teamId === team.id).map((injury) => <article key={`${injury.playerId}-${injury.playerName}`} className="player-card"><PersonPhoto src={injury.playerPhoto} alt={injury.playerName} size={58} /><div><h4>{injury.playerName}</h4><p>{localizePlayerPosition(injury.playerPosition) || "Pozycja: brak danych"}</p></div><div className="player-metrics"><span>Status <b>{injury.type === "missing" ? "Nieobecny" : "Wątpliwy"}</b></span><span>Przyczyna <b>{injury.reason || "brak danych"}</b></span></div>{injury.regularity && <small>{injury.regularity}</small>}</article>)}</div>{!injuries.some((injury) => injury.teamId === team.id) && <SectionMessage>Brak zgłoszonych absencji dla tej drużyny.</SectionMessage>}</section>; })}</div>;
}

function OddsTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const odds = snapshot.odds;
  return <div className="space-y-5"><SectionMessage>Kursy z automatycznego źródła są opcjonalne. Kursy ręcznie zweryfikowane przed publikacją mają pierwszeństwo.</SectionMessage>{odds ? <section className="football-panel"><h3>{odds.bookmaker || "Dostawca kursów"}</h3><p>Aktualizacja: {odds.updatedAt ? date(odds.updatedAt) : "czas niepodany"}</p><div className="odds-market-grid">{odds.markets.slice(0, 12).map((market) => <article key={`${market.id}-${market.name}`}><strong>{market.name}</strong>{market.values.map((item) => <div key={item.label}><span>{item.label}</span><b>{value(item.odd, "", 2)}</b></div>)}</article>)}</div></section> : <SectionMessage>Brak kursów przedmeczowych dla tego spotkania. Dostępność zależy od ligi, bukmachera i czasu do pierwszego gwizdka.</SectionMessage>}</div>;
}

function QualityTab({ snapshot }: { snapshot: FootballAnalysisSnapshot }) {
  const labels: Record<keyof FootballAnalysisSnapshot["coverage"], string> = { fixture: "Mecz", recentForm: "Ostatnia forma", venueSplits: "Dom i wyjazd", standings: "Tabela", teamStatistics: "Statystyki drużyn", h2h: "Historia spotkań", injuries: "Absencje", lineups: "Składy", players: "Zawodnicy", events: "Zdarzenia meczowe", predictions: "Kontekst prognostyczny", odds: "Kursy" };
  const status = (value: string) => value === "complete" ? "Pełne" : value === "partial" ? "Częściowe" : value === "error" ? "Błąd pobrania" : "Brak danych";
  return <div className="space-y-5"><section className="football-panel"><h3>Kompletność sekcji</h3><p>Każda sekcja pokazuje własną dostępność i wielkość próby. Brak danych nie jest zamieniany na zero.</p><div className="coverage-grid">{Object.entries(snapshot.coverage).map(([key, section]) => <article key={key} className={`coverage-card coverage-${section.status}`}><span>{status(section.status)}</span><h4>{labels[key as keyof typeof labels]}</h4><strong>{section.samples} rekordów / próbek</strong><p>{publicMessage(section.message, "Brak dodatkowej informacji.")}</p></article>)}</div></section>{snapshot.warnings.length > 0 && <section className="football-panel"><h3>Ostrzeżenia jakości</h3><ul className="football-list">{snapshot.warnings.map((warning) => <li key={warning}>{publicMessage(warning, "Ostrzeżenie dotyczące jakości danych.")}</li>)}</ul></section>}<p className="text-xs text-slate-500">Dane zaktualizowano {date(snapshot.fetchedAt)}. Raport mógł zostać ręcznie zweryfikowany przed publikacją.</p></div>;
}

function tabStatus(key: TabKey, snapshot: FootballAnalysisSnapshot) {
  const mapped = key === "lineups" ? snapshot.coverage.lineups.status
    : key === "players" ? snapshot.coverage.players.status
      : key === "absences" ? snapshot.coverage.injuries.status
        : key === "standings" ? snapshot.coverage.standings.status
          : key === "h2h" ? snapshot.coverage.h2h.status
            : key === "odds" ? snapshot.coverage.odds.status
              : key === "recent" || key === "venue" || key === "goals" || key === "corners" || key === "cards" || key === "shots" ? snapshot.coverage.recentForm.status
                : snapshot.signals.length || key === "quality" || key === "summary" ? "complete" : "unavailable";
  return mapped === "complete" ? "pełne" : mapped === "partial" ? "częściowe" : "brak danych";
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
    case "absences": content = <AbsencesTab snapshot={snapshot} />; break;
    case "signals": content = <SignalsTab snapshot={snapshot} override={premiumSections.advancedRisk} />; break;
    case "risks": content = <RisksTab snapshot={snapshot} override={premiumSections.advancedRisk} />; break;
    case "odds": content = <OddsTab snapshot={snapshot} />; break;
    case "quality": content = <QualityTab snapshot={snapshot} />; break;
  }
  function handleTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    const lastIndex = tabs.length - 1;
    const nextIndex = event.key === "ArrowRight" ? (index === lastIndex ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? lastIndex : index - 1)
        : event.key === "Home" ? 0
          : event.key === "End" ? lastIndex
            : null;
    if (nextIndex === null) return;
    event.preventDefault();
    setActive(tabs[nextIndex].key);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']")[nextIndex]?.focus();
  }
  return (
    <section className="football-report-tabs">
      <nav className="football-tab-list" aria-label="Sekcje raportu" role="tablist">{tabs.map((item, index) => <button key={item.key} id={`report-tab-${item.key}`} type="button" role="tab" aria-selected={active === item.key} aria-controls={`report-panel-${item.key}`} tabIndex={active === item.key ? 0 : -1} className={active === item.key ? "active" : ""} onClick={() => setActive(item.key)} onKeyDown={(event) => handleTabKey(event, index)}><FootballIcon name={item.icon} size={17} /><strong>{item.label}</strong><small>{tabStatus(item.key, snapshot)}</small>{item.premium && <span aria-label="Premium">P</span>}</button>)}</nav>
      <div id={`report-panel-${active}`} className="football-tab-panel" role="tabpanel" aria-labelledby={`report-tab-${active}`} tabIndex={0}>{locked ? <PremiumLockCard title={tab.label} text="Premium wkrótce — rozszerzona sekcja nie jest jeszcze dostępna w wariancie Darmowym." /> : content}</div>
    </section>
  );
}
