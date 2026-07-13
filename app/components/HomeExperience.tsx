"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { faqItems, pricingPlans } from "@/lib/analityq-data";
import {
  databaseChangeEvent,
  getPublicDatabaseErrorMessage,
  getPublishedAnalyses,
} from "@/lib/database";
import { selectFeaturedAnalysis } from "@/lib/featured-analysis";
import { predictTeamLineup } from "@/lib/football-api/predicted-lineup";
import type { MatchSignal } from "@/lib/football-api/types";
import type { MatchAnalysisRecord } from "@/lib/types";
import { getRiskLabel } from "./Badges";
import { CountryLabel, LeagueLogo, TeamLogo } from "./ApiImage";
import { FAQAccordion } from "./FAQAccordion";
import { PricingCard } from "./PricingCard";

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "short",
  day: "2-digit",
  month: "long",
});

const timeFormatter = new Intl.DateTimeFormat("pl-PL", {
  hour: "2-digit",
  minute: "2-digit",
});

function matchDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "Termin do ustalenia", time: "—" };
  return { date: dateFormatter.format(date), time: timeFormatter.format(date) };
}

function isToday(value: string, now: Date) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime())
    && date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function lineupStatus(match: MatchAnalysisRecord) {
  const snapshot = match.dataSource?.snapshot;
  const lineups = snapshot?.lineups;
  if (lineups?.official && lineups.teams.some((team) => team.startXI.length > 0)) {
    return "Oficjalne";
  }
  if (snapshot && lineups?.historicalStarters.length === 2 && lineups.historicalStarters.every((team) =>
    predictTeamLineup(team, snapshot.injuries, snapshot.playerInsights).available,
  )) {
    return "Przewidywane";
  }
  if (lineups?.historicalStarters.some((team) => team.players.length >= 9)) {
    return "Najczęściej wybierani";
  }
  return "Brak wystarczających danych";
}

function signalStrengthLabel(strength: MatchSignal["strength"]) {
  if (strength === "strong") return "Silny sygnał";
  if (strength === "medium") return "Umiarkowany sygnał";
  return "Sygnał pomocniczy";
}

function signalCategoryLabel(signal: MatchSignal) {
  const labels: Record<MatchSignal["category"], string> = {
    goals: "Gole",
    corners: "Rzuty rożne",
    cards: "Kartki",
    shots: "Strzały",
    form: "Forma",
    homeAway: "Dom i wyjazd",
    standings: "Tabela",
    h2h: "Historia spotkań",
    lineups: "Składy",
    injuries: "Absencje",
    risk: "Ryzyko",
  };
  return labels[signal.category];
}

function MatchOfTheDay({ match }: { match: MatchAnalysisRecord }) {
  const snapshot = match.dataSource?.snapshot;
  const metrics = calculateFullReportMetrics(match);
  const kickoff = matchDate(match.basic.kickoff);
  const signalCount = snapshot?.signals.length ?? 0;
  const absenceCount = snapshot?.injuries.missing.length ?? 0;

  return (
    <article id="mecz-dnia" className="home-featured-card animate-reveal">
      <div className="home-featured-topline">
        <span>Mecz dnia</span>
        <span>{kickoff.date} · {kickoff.time}</span>
      </div>

      <div className="home-league-line">
        <LeagueLogo src={snapshot?.fixture.leagueLogo} alt={match.basic.league || "Rozgrywki"} size={34} />
        <div>
          <strong>{match.basic.league || "Rozgrywki"}</strong>
          {snapshot ? (
            <CountryLabel code={snapshot.fixture.countryCode} name={snapshot.fixture.countryName} flagSrc={snapshot.fixture.leagueFlag} />
          ) : (
            <small>{match.basic.country || "Kraj: brak danych"}</small>
          )}
        </div>
      </div>

      <div className="home-featured-teams">
        <div>
          <TeamLogo src={snapshot?.fixture.homeTeam.logo} alt={match.basic.homeTeam || "Gospodarz"} size={62} />
          <strong>{match.basic.homeTeam || "Gospodarz"}</strong>
        </div>
        <span>VS</span>
        <div>
          <TeamLogo src={snapshot?.fixture.awayTeam.logo} alt={match.basic.awayTeam || "Gość"} size={62} />
          <strong>{match.basic.awayTeam || "Gość"}</strong>
        </div>
      </div>

      <p className="home-featured-venue">
        {snapshot?.fixture.venueName || match.basic.venue || "Stadion: brak danych"}
      </p>

      <div className="home-featured-metrics">
        <div><span>Sygnały</span><strong>{signalCount || "—"}</strong></div>
        <div><span>Kompletność</span><strong>{metrics.dataCompleteness.percent}%</strong></div>
        <div><span>Absencje</span><strong>{snapshot ? absenceCount : "—"}</strong></div>
        <div><span>Składy</span><strong>{lineupStatus(match)}</strong></div>
      </div>

      <Link href={`/analizy/${match.slug}`} className="home-featured-link">
        Otwórz pełny raport
      </Link>
    </article>
  );
}

function FeaturedSignals({ match }: { match: MatchAnalysisRecord }) {
  const signals = match.dataSource?.snapshot?.signals.slice(0, 3) ?? [];

  return (
    <section className="home-section home-signals-section" aria-labelledby="sygnaly-title">
      <div className="home-section-heading">
        <div>
          <p className="eyebrow">Mecz pod lupą</p>
          <h2 id="sygnaly-title">Najważniejsze sygnały</h2>
        </div>
        <Link href={`/analizy/${match.slug}#sygnaly`}>Zobacz cały raport</Link>
      </div>

      {signals.length > 0 ? (
        <div className="home-signal-grid">
          {signals.map((signal, index) => (
            <article key={signal.id} className={`home-signal-card home-signal-${signal.strength}`}>
              <div className="home-signal-index">0{index + 1}</div>
              <div>
                <p>{signalCategoryLabel(signal)} · {signalStrengthLabel(signal.strength)}</p>
                <h3>{signal.title}</h3>
                <span>{signal.evidence}</span>
              </div>
              <strong>{signal.confidence}%</strong>
            </article>
          ))}
        </div>
      ) : (
        <div className="home-neutral-state">Dla tego raportu nie ma jeszcze wystarczających danych do pokazania kluczowych sygnałów.</div>
      )}
    </section>
  );
}

function TodayAnalysisCard({ match }: { match: MatchAnalysisRecord }) {
  const snapshot = match.dataSource?.snapshot;
  const metrics = calculateFullReportMetrics(match);
  const kickoff = matchDate(match.basic.kickoff);
  const strongest = snapshot?.signals[0];

  return (
    <article className="home-today-card">
      <div className="home-today-card-head">
        <div className="flex items-center gap-2">
          <LeagueLogo src={snapshot?.fixture.leagueLogo} alt={match.basic.league || "Rozgrywki"} size={30} />
          <span>{match.basic.league || "Rozgrywki"}</span>
        </div>
        <time dateTime={match.basic.kickoff}>{kickoff.time}</time>
      </div>
      <div className="home-today-teams">
        <div><TeamLogo src={snapshot?.fixture.homeTeam.logo} alt={match.basic.homeTeam || "Gospodarz"} size={36} /><strong>{match.basic.homeTeam || "Gospodarz"}</strong></div>
        <span>–</span>
        <div><TeamLogo src={snapshot?.fixture.awayTeam.logo} alt={match.basic.awayTeam || "Gość"} size={36} /><strong>{match.basic.awayTeam || "Gość"}</strong></div>
      </div>
      <p className="home-today-signal">{strongest ? strongest.title : "Sygnały pojawią się po uzupełnieniu danych."}</p>
      <div className="home-today-meta">
        <span>Ryzyko: <strong>{getRiskLabel(metrics.effectiveRiskLevel)}</strong></span>
        <span>Dane: <strong>{metrics.dataCompleteness.percent}%</strong></span>
      </div>
      <Link href={`/analizy/${match.slug}`}>Zobacz analizę</Link>
    </article>
  );
}

function LineupTeaser({ match }: { match: MatchAnalysisRecord }) {
  const snapshot = match.dataSource?.snapshot;
  const missing = snapshot?.injuries.missing ?? [];
  const questionable = snapshot?.injuries.questionable ?? [];
  const status = lineupStatus(match);

  return (
    <section className="home-section home-lineup-teaser" aria-labelledby="sklady-title">
      <div>
        <p className="eyebrow">Składy i absencje</p>
        <h2 id="sklady-title">Kto może zmienić obraz meczu?</h2>
        <p>W raporcie łączymy dostępność zawodników z kontekstem pozycji, regularnością gry i statystykami.</p>
        <Link href={`/analizy/${match.slug}#sklady`} className="btn-secondary">Sprawdź składy</Link>
      </div>
      <div className="home-lineup-summary">
        <div><span>Status składów</span><strong>{status}</strong></div>
        <div><span>Potwierdzone absencje</span><strong>{snapshot ? missing.length : "—"}</strong></div>
        <div><span>Występ niepewny</span><strong>{snapshot ? questionable.length : "—"}</strong></div>
      </div>
    </section>
  );
}

export function HomeExperience() {
  const [matches, setMatches] = useState<MatchAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [now] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setErrorMessage("");
      try {
        const data = await getPublishedAnalyses();
        if (active) setMatches(data);
      } catch (error) {
        if (active) {
          setMatches([]);
          setErrorMessage(getPublicDatabaseErrorMessage(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    window.addEventListener(databaseChangeEvent, load);
    return () => {
      active = false;
      window.removeEventListener(databaseChangeEvent, load);
    };
  }, []);

  const featured = useMemo(() => selectFeaturedAnalysis(matches, now), [matches, now]);
  const today = useMemo(
    () => matches.filter((match) => isToday(match.basic.kickoff, now)).slice(0, 8),
    [matches, now],
  );

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-backdrop" aria-hidden="true" />
        <div className="home-hero-scan" aria-hidden="true" />
        <div className="section-shell home-hero-grid">
          <div className="home-hero-copy animate-fade-up">
            <p className="eyebrow">AnalityQ 2.0 · Raporty meczowe</p>
            <h1>Zobacz mecz głębiej niż wynik i kurs.</h1>
            <p>Forma, dom i wyjazd, składy, absencje, strzały, rożne, kartki i najważniejsze sygnały w jednym raporcie.</p>
            <div className="home-hero-actions">
              <Link href={featured ? "#mecz-dnia" : "/analizy"} className="btn-primary">Zobacz mecz dnia</Link>
              <Link href="#dzisiejsze-analizy" className="btn-secondary">Dzisiejsze analizy</Link>
            </div>
            <Link href="/jak-to-dziala" className="home-hero-text-link">Jak działa AnalityQ</Link>
          </div>

          {loading ? (
            <div className="home-featured-skeleton" aria-live="polite">Ładowanie meczu dnia…</div>
          ) : featured ? (
            <MatchOfTheDay match={featured} />
          ) : (
            <div id="mecz-dnia" className="home-featured-empty">
              <p className="eyebrow">Mecz dnia</p>
              <h2>Nie wybrano jeszcze opublikowanej analizy.</h2>
              <p>{errorMessage || "Gdy pojawi się opublikowany raport, pokażemy tutaj najbliższe spotkanie."}</p>
              <Link href="/analizy" className="btn-secondary">Przejdź do analiz</Link>
            </div>
          )}
        </div>
      </section>

      {featured && <FeaturedSignals match={featured} />}

      <section id="dzisiejsze-analizy" className="home-section" aria-labelledby="dzisiaj-title">
        <div className="home-section-heading">
          <div><p className="eyebrow">Na dziś</p><h2 id="dzisiaj-title">Dzisiejsze analizy</h2></div>
          <Link href="/analizy">Wszystkie analizy</Link>
        </div>
        {today.length > 0 ? (
          <div className="home-today-track">
            {today.map((match) => <TodayAnalysisCard key={match.id} match={match} />)}
          </div>
        ) : (
          <div className="home-neutral-state">Na dziś nie ma jeszcze opublikowanych analiz. Sprawdź pełną listę raportów.</div>
        )}
      </section>

      {featured && <LineupTeaser match={featured} />}

      <section className="home-section home-how" aria-labelledby="jak-title">
        <div>
          <p className="eyebrow">Jak działa AnalityQ</p>
          <h2 id="jak-title">Od danych do czytelnego obrazu meczu.</h2>
          <p>Porządkujemy formę, statystyki i kontekst kadrowy, wskazujemy najmocniejsze sygnały oraz jasno pokazujemy ryzyko i braki danych.</p>
          <Link href="/jak-to-dziala" className="btn-secondary">Poznaj sposób analizy</Link>
        </div>
        <ol>
          <li><span>01</span><div><strong>Dane meczowe</strong><p>Forma, dom i wyjazd, składy, absencje oraz statystyki.</p></div></li>
          <li><span>02</span><div><strong>Sygnały i ryzyka</strong><p>Najważniejsze zależności opisane razem z jakością próby.</p></div></li>
          <li><span>03</span><div><strong>Raport</strong><p>Jedna historia meczu, którą da się szybko przeczytać.</p></div></li>
        </ol>
      </section>

      <section className="home-section" aria-labelledby="plany-title">
        <div className="home-section-heading">
          <div><p className="eyebrow">Dostęp</p><h2 id="plany-title">Darmowy vs Premium</h2></div>
          <Link href="/premium">Pełne porównanie</Link>
        </div>
        <div className="home-pricing-grid">
          {pricingPlans.map((plan) => <PricingCard key={plan.name} plan={plan} />)}
        </div>
      </section>

      <section className="home-section home-faq" aria-labelledby="faq-title">
        <div><p className="eyebrow">FAQ</p><h2 id="faq-title">Najważniejsze pytania</h2><p>Krótko o raportach, danych i sposobie czytania sygnałów.</p></div>
        <FAQAccordion limit={Math.min(5, faqItems.length)} />
      </section>
    </>
  );
}
