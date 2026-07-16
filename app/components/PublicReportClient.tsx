"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { modelDisclaimer } from "@/lib/analityq-data";
import {
  isNationalTeamName,
  localizeCompetitionName,
  localizePublicText,
  localizeRoundName,
  localizeTeamName,
} from "@/lib/countries";
import {
  databaseChangeEvent,
  getAnalysisBySlug,
  getPublicDatabaseErrorMessage,
} from "@/lib/database";
import {
  generateKeySignals,
  generateModelSummary,
  generateRiskText,
  generateScenarioText,
} from "@/lib/reportText";
import type { MatchAnalysisRecord, NumericValue } from "@/lib/types";
import { ConfidenceBadge, RiskBadge, StatusBadge } from "./Badges";
import { EmptyState } from "./EmptyState";
import { Logo } from "./Logo";
import { MarketAnalysisTable } from "./MarketAnalysisTable";
import { MetricCard } from "./MetricCard";
import { PremiumLockCard } from "./PremiumLockCard";
import { ValueIndexCard } from "./ValueIndexCard";
import { DataCompletenessBar } from "./DataCompletenessBar";
import { StatisticsComparison } from "./StatisticsComparison";
import { CountryLabel, LeagueLogo, TeamLogo } from "./ApiImage";
import { FootballReportTabs } from "./FootballReportTabs";
import { PreMatchHighlights } from "./PreMatchHighlights";
import { usePremiumMode } from "@/lib/premium-mode";
import { contextualSnapshotContent } from "@/lib/football-api/match-context";

function formatDate(value: string) {
  if (!value) return "brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatNumber(value: NumericValue, digits = 2) {
  return value === null ? "brak danych" : value.toFixed(digits);
}

function FormBadges({ value }: { value: string }) {
  const items = value
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  if (items.length === 0) {
    return <p className="text-sm text-slate-500">brak wpisanej formy</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="form-pill">
          {item}
        </span>
      ))}
    </div>
  );
}

function TextPanel({ title, text }: { title: string; text: string }) {
  return (
    <section className="glass-card p-5">
      <h3 className="text-xl font-black text-white">{title}</h3>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
        {text || "Ta starsza analiza nie zawiera danych ani ręcznej notatki dla tej sekcji."}
      </p>
    </section>
  );
}

function ProbabilityMetric({ label, value }: { label: string; value: NumericValue }) {
  return <div className="probability-metric"><span>{label}</span><strong>{value === null ? "—" : `${value.toFixed(1)}%`}</strong></div>;
}

function coverageValue(match: MatchAnalysisRecord, key: "goals" | "shots" | "corners" | "cards" | "xg") {
  const coverage = match.dataSource?.coverage;
  if (!coverage) return "Brak metadanych";
  const coverageKey = {
    goals: "goalsForLast5",
    shots: "shotsForLast5",
    corners: "cornersForLast5",
    cards: "cardsForLast5",
    xg: "xgForLast5",
  }[key] as keyof typeof coverage.home;
  const available = (coverage.home[coverageKey] || 0) + (coverage.away[coverageKey] || 0);
  const possible = match.dataSource!.includedHomeFixtures.length + match.dataSource!.includedAwayFixtures.length;
  return `${available}/${possible} spotkań`;
}

export function PublicReportClient({ slug }: { slug: string }) {
  const [match, setMatch] = useState<MatchAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const metrics = useMemo(() => (match ? calculateFullReportMetrics(match) : null), [match]);
  const { active: premiumModeActive } = usePremiumMode();

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getAnalysisBySlug(slug);
        if (active) setMatch(data);
      } catch (error) {
        if (active) {
          setMatch(null);
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
  }, [slug]);

  if (loading) {
    return (
      <section className="section-shell">
        <div className="report-loading-brand"><Logo href="" /><p>Ładowanie raportu…</p></div>
        <div className="h-80 animate-soft-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="section-shell">
        <EmptyState
          title="Nie udało się wczytać raportu"
          description={errorMessage}
          action={
            <Link href="/analizy" className="btn-secondary justify-center">
              Wróć do analiz
            </Link>
          }
        />
      </section>
    );
  }

  if (match === null) {
    return (
      <section className="section-shell">
        <EmptyState
          title="Nie znaleziono raportu."
          description="Raport nie istnieje w bazie online albo został usunięty."
          action={
            <Link href="/analizy" className="btn-secondary justify-center">
              Wróć do analiz
            </Link>
          }
        />
      </section>
    );
  }

  if (match.publicationStatus !== "published") {
    return (
      <section className="section-shell">
        <EmptyState
          title="Raport nie jest dostępny"
          description="Ta analiza nie została jeszcze opublikowana albo została archiwizowana."
          action={
            <Link href="/analizy" className="btn-secondary justify-center">
              Wróć do analiz
            </Link>
          }
        />
      </section>
    );
  }

  if (!metrics) return null;

  const reportMode = premiumModeActive ? "premium" : match.basic.status;

  const snapshot = match.dataSource?.snapshot;
  const snapshotContent = snapshot ? contextualSnapshotContent(snapshot) : null;
  const homeName = localizeTeamName(snapshot?.fixture.homeTeam.name || match.basic.homeTeam) || "Gospodarz";
  const awayName = localizeTeamName(snapshot?.fixture.awayTeam.name || match.basic.awayTeam) || "Gość";
  const leagueName = localizeCompetitionName(snapshot?.fixture.leagueName || match.basic.league) || "Rozgrywki";
  const roundName = localizeRoundName(snapshot?.fixture.round);
  const modelSummary = localizePublicText(match.notes.summary.trim()
    || match.notes.finalAssessment.trim()
    || snapshotContent?.automaticSummary
    || generateModelSummary(match, metrics));
  const scenarioText = localizePublicText(match.notes.scenarios.trim() || generateScenarioText(match, metrics));
  const riskText = localizePublicText(match.notes.keyRisks.trim() || generateRiskText(match, metrics));
  const keySignals = snapshot ? [] : generateKeySignals(match, metrics);
  const premiumCards = [
    ["Rzuty rożne", match.premiumSections.cornersAnalysis],
    ["Kartki", match.premiumSections.cardsAnalysis],
    ["Strzały", match.premiumSections.shotsAnalysis],
    ["Połowy", match.premiumSections.halvesAnalysis],
    ["Zaawansowane ryzyko", match.premiumSections.advancedRisk],
    ["Zaawansowane H2H", match.premiumSections.h2hAdvanced],
    ["Zaawansowane składy", match.premiumSections.lineupsAdvanced],
  ] as const;

  return (
    <section className="section-shell">
      <div className="report-surface">
        <div className="report-header report-header-premium">
          <div className="report-brand-watermark" aria-hidden="true" />
          <div>
            <Logo href="" />
            <p className="eyebrow mt-8">Raport AnalityQ</p>
            {snapshot ? (
              <>
                <div className="report-league-identity">
                  <LeagueLogo src={snapshot.fixture.leagueLogo} alt={leagueName} size={54} />
                  <div>
                    <strong>{leagueName}</strong>
                    <span><CountryLabel code={snapshot.fixture.countryCode} name={snapshot.fixture.countryName} flagSrc={snapshot.fixture.leagueFlag} /> · sezon {snapshot.fixture.season}{roundName ? ` · ${roundName}` : ""}</span>
                  </div>
                </div>
                <div className="report-team-identity">
                  <div><TeamLogo src={snapshot.fixture.homeTeam.logo} alt={homeName} size={96} priority /><h1 title={homeName}>{homeName}</h1><span>{snapshotContent?.venueContext.mode === "neutral" ? "Drużyna 1" : "Gospodarz"}{isNationalTeamName(snapshot.fixture.homeTeam.name) && <CountryLabel name={snapshot.fixture.homeTeam.name} compact />}</span></div>
                  <b>VS</b>
                  <div><TeamLogo src={snapshot.fixture.awayTeam.logo} alt={awayName} size={96} priority /><h1 title={awayName}>{awayName}</h1><span>{snapshotContent?.venueContext.mode === "neutral" ? "Drużyna 2" : "Gość"}{isNationalTeamName(snapshot.fixture.awayTeam.name) && <CountryLabel name={snapshot.fixture.awayTeam.name} compact />}</span></div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{formatDate(match.basic.kickoff)}{snapshot.fixture.referee ? ` · sędzia: ${snapshot.fixture.referee}` : ""}</p>
              </>
            ) : (
              <>
                <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">
                  {homeName} vs {awayName}
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {leagueName} · {match.basic.country || "kraj nieuzupełniony"} · {formatDate(match.basic.kickoff)}
                </p>
              </>
            )}
            <p className="mt-2 text-sm text-slate-400">{match.basic.venue ? `Stadion / miejsce: ${match.basic.venue}` : "Stadion / miejsce: brak danych"}</p>
            {snapshotContent && <p className={`report-venue-context report-venue-${snapshotContent.venueContext.mode}`}><strong>{snapshotContent.venueContext.label}</strong> · {snapshotContent.venueContext.reason}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status={match.basic.status} />
              <RiskBadge level={metrics.effectiveRiskLevel} />
              <ConfidenceBadge value={metrics.confidence} />
              {snapshot && <a href="#sklady" className="report-lineups-link">Składy meczowe</a>}
            </div>
          </div>
          <div className="report-kpi-grid grid gap-4 sm:grid-cols-2 lg:min-w-[430px]">
            <ValueIndexCard value={metrics.valueIndex} />
            <div className="glass-card p-5">
              <p className="text-sm text-slate-400">Najlepszy sygnał value</p>
              <p className="mt-2 text-2xl font-black text-white">{metrics.bestValueMarket}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Zakres raportu: {reportMode === "premium" ? `Premium${premiumModeActive && match.basic.status !== "premium" ? " · tryb lokalny" : ""}` : "Darmowy"}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Poziom ryzyka" value={metrics.effectiveRiskLevel === "low" ? "Niski" : metrics.effectiveRiskLevel === "medium" ? "Średni" : "Wysoki"} note={match.settings.riskLevel === "auto" ? "wyliczony automatycznie" : "ustawiony ręcznie"} tone="cyan" />
          <MetricCard label="Pewność analizy" value={`${Math.round(metrics.confidence)}%`} note="jakość i kompletność danych" tone="gold" />
          <MetricCard label="Kompletność danych" value={`${Math.round(metrics.dataCompleteness.ratio * 100)}%`} note={`${metrics.dataCompleteness.missing} pól bez danych`} />
          <MetricCard label="Najlepszy sygnał value" value={metrics.bestValueMarket} note="rynek z najwyższym dodatnim edge" tone="gold" />
        </div>

        <div className="mt-5"><DataCompletenessBar completeness={metrics.dataCompleteness} /></div>

        {snapshot && <PreMatchHighlights snapshot={snapshot} />}

        {snapshot && (
          <FootballReportTabs
            snapshot={snapshot}
            mode={reportMode}
            summary={modelSummary}
            premiumSections={match.premiumSections}
          />
        )}

        {!snapshot && <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <TextPanel title="Podsumowanie modelu" text={modelSummary} />
          <section className="glass-card p-5">
            <h3 className="text-xl font-black text-white">Kluczowe sygnały</h3>
            <div className="mt-4 space-y-3">
              {keySignals.map((signal) => (
                <p key={signal} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm leading-6 text-slate-300">
                  {signal}
                </p>
              ))}
            </div>
          </section>
        </div>}

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label={`Oczekiwane gole · ${homeName}`} value={formatNumber(metrics.expectedHomeGoals)} note={snapshotContent?.venueContext.mode === "neutral" ? "teren neutralny" : "gospodarz"} tone="cyan" />
          <MetricCard label={`Oczekiwane gole · ${awayName}`} value={formatNumber(metrics.expectedAwayGoals)} note={snapshotContent?.venueContext.mode === "neutral" ? "teren neutralny" : "wyjazd"} />
          <MetricCard label="Łączne oczekiwane gole" value={formatNumber(metrics.totalExpectedGoals)} note="suma modelowa" tone="gold" />
          <MetricCard label="Oczekiwane rożne" value={formatNumber(metrics.expectedCorners, 1)} note="łącznie" />
          <MetricCard label="Oczekiwane kartki" value={formatNumber(metrics.expectedCards, 1)} note="łącznie" />
        </div>

        {!snapshot && <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="glass-card p-5">
            <h3 className="text-xl font-black text-white">Forma drużyn</h3>
            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-3 font-bold text-white">{match.basic.homeTeam || "Gospodarz"}</p>
                <FormBadges value={match.manualStats.home.formLast5} />
              </div>
              <div>
                <p className="mb-3 font-bold text-white">{match.basic.awayTeam || "Gość"}</p>
                <FormBadges value={match.manualStats.away.formLast5} />
              </div>
            </div>
          </section>

          <StatisticsComparison match={match} metrics={metrics} />
        </div>}

        <section className="mt-8 glass-card p-5">
          <p className="eyebrow">Model statystyczny</p>
          <h2 className="mt-2 text-2xl font-black text-white">Analiza prawdopodobieństw</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ProbabilityMetric label={`1 — ${homeName}`} value={metrics.modelProbabilities.homeWin} />
            <ProbabilityMetric label="X — remis" value={metrics.modelProbabilities.draw} />
            <ProbabilityMetric label={`2 — ${awayName}`} value={metrics.modelProbabilities.awayWin} />
            <ProbabilityMetric label="Powyżej 2,5 gola" value={metrics.modelProbabilities.over25} />
            <ProbabilityMetric label="Poniżej 2,5 gola" value={metrics.modelProbabilities.under25} />
            <ProbabilityMetric label="BTTS — tak" value={metrics.modelProbabilities.bttsYes} />
            <ProbabilityMetric label="Rożne powyżej 8,5" value={metrics.modelProbabilities.cornersOver85} />
            <ProbabilityMetric label="Kartki powyżej 3,5" value={metrics.modelProbabilities.cardsOver35} />
          </div>
        </section>

        <section className="mt-8">
          <p className="eyebrow">Model a rynek</p>
          <h2 className="mb-2 mt-2 text-2xl font-black text-white">Ocena modelu i kursów</h2>
          <p className="mb-5 text-sm leading-6 text-slate-400">Kompaktowe porównanie bez szerokiej tabeli i bez procentów korekty administratora.</p>
          <MarketAnalysisTable metrics={metrics} />
        </section>

        {!snapshot && <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TextPanel title="Scenariusze meczu" text={scenarioText} />
          <TextPanel title="Ryzyka" text={riskText} />
        </div>}

        <section className="mt-8 rounded-2xl border border-cyan-200/12 bg-cyan-200/[0.035] p-5">
          <p className="eyebrow">Transparentność raportu</p>
          <h2 className="mt-2 text-xl font-black text-white">Informacje o danych</h2>
          {match.dataSource ? (
            <>
              <p className="mt-3 text-sm leading-7 text-slate-300">{match.dataSource.fetchedAt ? `Dane zaktualizowano ${formatDate(match.dataSource.fetchedAt)}.` : "Brak daty pobrania danych."} Analiza obejmuje {match.dataSource.includedHomeFixtures.length} ostatnich spotkań gospodarzy i {match.dataSource.includedAwayFixtures.length} ostatnich spotkań gości.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="data-source-item"><span>Rodzaj danych</span><strong>Dane meczowe zweryfikowane przed publikacją</strong></div>
                <div className="data-source-item"><span>Ostatnie pobranie</span><strong>{match.dataSource.fetchedAt ? formatDate(match.dataSource.fetchedAt) : "Brak danych"}</strong></div>
                <div className="data-source-item"><span>Spotkania gospodarzy</span><strong>{match.dataSource.includedHomeFixtures.length}</strong></div>
                <div className="data-source-item"><span>Spotkania gości</span><strong>{match.dataSource.includedAwayFixtures.length}</strong></div>
                <div className="data-source-item"><span>Dostępność goli</span><strong>{coverageValue(match, "goals")}</strong></div>
                <div className="data-source-item"><span>Dostępność strzałów</span><strong>{coverageValue(match, "shots")}</strong></div>
                <div className="data-source-item"><span>Dostępność rzutów rożnych</span><strong>{coverageValue(match, "corners")}</strong></div>
                <div className="data-source-item"><span>Dostępność kartek</span><strong>{coverageValue(match, "cards")}</strong></div>
                <div className="data-source-item"><span>Dostępność xG</span><strong>{coverageValue(match, "xg")}</strong></div>
                <div className="data-source-item"><span>Kompletność danych</span><strong>{metrics.dataCompleteness.percent}%</strong></div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-400">Raport nie zawiera informacji o czasie ostatniej aktualizacji danych.</p>
          )}
          <p className="mt-4 text-xs leading-6 text-slate-500">Kompletność danych wejściowych: {metrics.dataCompleteness.percent}%. Dane mogą być ręcznie weryfikowane i korygowane przed publikacją.</p>
        </section>

        {!snapshot && <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Premium</p>
              <h2 className="mt-2 text-2xl font-black text-white">Rozszerzone sekcje raportu</h2>
            </div>
          </div>

          {reportMode === "premium" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {premiumCards.map(([title, text]) => (
                <TextPanel key={title} title={title} text={text} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {premiumCards.map(([title]) => (
                <PremiumLockCard
                  key={title}
                  title={title}
                  text="Premium wkrótce — ta rozszerzona sekcja nie jest jeszcze dostępna w wariancie Darmowym."
                />
              ))}
            </div>
          )}
        </section>}

        <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
          {modelDisclaimer}
        </p>
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-6"><Logo href="" /><p className="text-right text-xs text-slate-500">Profesjonalny raport statystyczny AnalityQ</p></div>
      </div>
    </section>
  );
}
