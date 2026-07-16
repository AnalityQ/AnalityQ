"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { faqItems, pricingPlans } from "@/lib/analityq-data";
import {
  isNationalTeamName,
  localizeCompetitionName,
  localizePublicText,
  localizeTeamName,
} from "@/lib/countries";
import {
  databaseChangeEvent,
  getPublicDatabaseErrorMessage,
  getPublishedAnalyses,
} from "@/lib/database";
import { selectFeaturedAnalysis } from "@/lib/featured-analysis";
import type { MatchSignal } from "@/lib/football-api/types";
import type { PublicAnalysisSummary } from "@/lib/public-analysis";
import { getRiskLabel } from "./Badges";
import { CountryLabel, LeagueLogo, TeamLogo } from "./ApiImage";
import { AnimatedNumber } from "./AnimatedNumber";
import { FAQAccordion } from "./FAQAccordion";
import { FootballCtaMotion, FootballIcon } from "./FootballIcon";
import { Logo } from "./Logo";
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

function compactNumber(value: number | null | undefined, digits = 1) {
  return typeof value !== "number" ? "—" : value.toFixed(digits).replace(".", ",");
}

function MatchOfTheDay({ match }: { match: PublicAnalysisSummary }) {
  const kickoff = matchDate(match.basic.kickoff);
  const homeName = localizeTeamName(match.homeTeam.name) || "Gospodarz";
  const awayName = localizeTeamName(match.awayTeam.name) || "Gość";
  const leagueName = localizeCompetitionName(match.league.name) || "Rozgrywki";
  const favorite = match.metrics.favorite;
  const favoriteName = favorite?.side === "home"
    ? homeName
    : favorite?.side === "away"
      ? awayName
      : favorite?.side === "draw"
        ? "Remis"
        : "Brak danych";

  return (
    <article id="mecz-dnia" className="home-featured-card animate-reveal">
      <div className="home-featured-topline">
        <span>Mecz dnia</span>
        <span>{kickoff.date} · {kickoff.time}</span>
      </div>

      <div className="home-featured-pitch" aria-hidden="true" />
      <div className="home-league-line">
        <LeagueLogo src={match.league.logo} alt={leagueName} size={46} />
        <div>
          <strong>{leagueName}</strong>
          <CountryLabel code={match.league.countryCode} name={match.league.country} flagSrc={match.league.flag} />
        </div>
      </div>

      <div className="home-featured-teams">
        <div>
          <TeamLogo src={match.homeTeam.logo} alt={homeName} size={82} priority />
          <strong title={homeName}>{homeName}</strong>
          {isNationalTeamName(match.homeTeam.name) && <CountryLabel name={match.homeTeam.name} compact />}
        </div>
        <span>VS</span>
        <div>
          <TeamLogo src={match.awayTeam.logo} alt={awayName} size={82} priority />
          <strong title={awayName}>{awayName}</strong>
          {isNationalTeamName(match.awayTeam.name) && <CountryLabel name={match.awayTeam.name} compact />}
        </div>
      </div>

      <p className="home-featured-venue">
        {match.venueName || "Stadion: brak danych"}
      </p>

      <p className={`home-venue-context home-venue-${match.venueContext.mode}`}>
        {match.venueContext.label} · {match.venueContext.reason}
      </p>

      <div className="home-featured-metrics">
        <div><FootballIcon name="goals" /><strong>{compactNumber(match.metrics.totalExpectedGoals, 2)}</strong><span>przewidywane gole</span></div>
        <div><FootballIcon name="corners" /><strong>{compactNumber(match.metrics.expectedCorners)}</strong><span>przewidywane rożne łącznie</span></div>
        <div><FootballIcon name="standings" /><strong>{favorite ? <AnimatedNumber value={favorite.probability} suffix="%" /> : "—"}</strong><span title={favoriteName}>faworyt · {favoriteName}</span></div>
        <div><FootballIcon name="value" /><strong><AnimatedNumber value={match.metrics.valueIndex} /></strong><span>Value Index</span></div>
      </div>

      <Link href={`/analizy/${match.slug}`} className="home-featured-link">
        <span>Otwórz pełny raport</span><FootballCtaMotion />
      </Link>
    </article>
  );
}

function FeaturedSignals({ match }: { match: PublicAnalysisSummary }) {
  const signals = match.signals;

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
                <h3>{localizePublicText(signal.title)}</h3>
                <span>{localizePublicText(signal.evidence)}</span>
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

function TodayAnalysisCard({ match }: { match: PublicAnalysisSummary }) {
  const kickoff = matchDate(match.basic.kickoff);
  const strongest = match.signals[0];
  const homeName = localizeTeamName(match.homeTeam.name) || "Gospodarz";
  const awayName = localizeTeamName(match.awayTeam.name) || "Gość";
  const leagueName = localizeCompetitionName(match.league.name) || "Rozgrywki";

  return (
    <article className="home-today-card">
      <div className="home-today-card-head">
        <div className="flex items-center gap-2">
          <LeagueLogo src={match.league.logo} alt={leagueName} size={30} />
          <span>{leagueName}</span>
        </div>
        <time dateTime={match.basic.kickoff}>{kickoff.time}</time>
      </div>
      <div className="home-today-teams">
        <div><TeamLogo src={match.homeTeam.logo} alt={homeName} size={42} /><strong title={homeName}>{homeName}</strong></div>
        <span>–</span>
        <div><TeamLogo src={match.awayTeam.logo} alt={awayName} size={42} /><strong title={awayName}>{awayName}</strong></div>
      </div>
      <p className="home-today-signal">{strongest ? localizePublicText(strongest.title) : "Sygnały pojawią się po uzupełnieniu danych."}</p>
      <div className="home-today-meta">
        <span>Ryzyko: <strong>{getRiskLabel(match.metrics.effectiveRiskLevel)}</strong></span>
        <span>Dane: <strong>{match.metrics.completeness}%</strong></span>
      </div>
      <Link href={`/analizy/${match.slug}`}>Zobacz analizę</Link>
    </article>
  );
}

function LineupTeaser({ match }: { match: PublicAnalysisSummary }) {

  return (
    <section className="home-section home-lineup-teaser" aria-labelledby="sklady-title">
      <div>
        <p className="eyebrow">Składy i absencje</p>
        <h2 id="sklady-title">Kto może zmienić obraz meczu?</h2>
        <p>W raporcie łączymy dostępność zawodników z kontekstem pozycji, regularnością gry i statystykami.</p>
        <Link href={`/analizy/${match.slug}#sklady`} className="btn-secondary">Otwórz składy meczowe</Link>
      </div>
      <div className="home-lineup-summary">
        <div><span>Status składów</span><strong>{match.lineupStatus}</strong></div>
        <div><span>Potwierdzone absencje</span><strong>{match.missingCount}</strong></div>
        <div><span>Występ niepewny</span><strong>{match.questionableCount}</strong></div>
      </div>
    </section>
  );
}

export function HomeExperience() {
  const [matches, setMatches] = useState<PublicAnalysisSummary[]>([]);
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
            <Logo href="" className="home-hero-brand" />
            <p className="eyebrow">AnalityQ · Raporty meczowe</p>
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
