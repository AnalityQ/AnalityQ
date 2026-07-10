"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { modelDisclaimer } from "@/lib/analityq-data";
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
import { PreviewModeToggle } from "./PreviewModeToggle";
import { ValueIndexCard } from "./ValueIndexCard";

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
        {text || "Brak danych w tej sekcji."}
      </p>
    </section>
  );
}

export function PublicReportClient({ slug }: { slug: string }) {
  const [match, setMatch] = useState<MatchAnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [mode, setMode] = useState<"free" | "premium">("free");
  const metrics = useMemo(() => (match ? calculateFullReportMetrics(match) : null), [match]);

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
        <p className="mb-4 text-sm font-bold text-cyan-100">Ładowanie raportu...</p>
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

  const modelSummary = match.notes.summary.trim() || match.notes.finalAssessment.trim() || generateModelSummary(match, metrics);
  const scenarioText = match.notes.scenarios.trim() || generateScenarioText(match, metrics);
  const riskText = match.notes.keyRisks.trim() || generateRiskText(match, metrics);
  const keySignals = generateKeySignals(match, metrics);
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
        <div className="report-header">
          <div>
            <Logo href="" />
            <p className="eyebrow mt-8">Raport AnalityQ</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">
              {match.basic.homeTeam || "Gospodarz"} vs {match.basic.awayTeam || "Gość"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {match.basic.league || "Liga nieuzupełniona"} · {match.basic.country || "kraj nieuzupełniony"} · {formatDate(match.basic.kickoff)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status={match.basic.status} />
              <RiskBadge level={metrics.effectiveRiskLevel} />
              <ConfidenceBadge value={metrics.confidence} />
            </div>
            {match.basic.fotmobUrl && (
              <a
                href={match.basic.fotmobUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex text-sm font-bold text-cyan-100 transition hover:text-white"
              >
                Źródło danych
              </a>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:min-w-[430px]">
            <ValueIndexCard value={metrics.valueIndex} />
            <div className="glass-card p-5">
              <p className="text-sm text-slate-400">Najlepszy sygnał value</p>
              <p className="mt-2 text-2xl font-black text-white">{metrics.bestValueMarket}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Tryb podglądu raportu</p>
              <div className="mt-4">
                <PreviewModeToggle mode={mode} onChange={setMode} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Poziom ryzyka" value={metrics.effectiveRiskLevel === "low" ? "Niski" : metrics.effectiveRiskLevel === "medium" ? "Średni" : "Wysoki"} note={match.settings.riskLevel === "auto" ? "wyliczony automatycznie" : "ustawiony ręcznie"} tone="cyan" />
          <MetricCard label="Pewność analizy" value={`${Math.round(metrics.confidence)}%`} note="jakość i kompletność danych" tone="gold" />
          <MetricCard label="Kompletność danych" value={`${Math.round(metrics.dataCompleteness.ratio * 100)}%`} note={`${metrics.dataCompleteness.missing} pól bez danych`} />
          <MetricCard label="Najlepszy sygnał value" value={metrics.bestValueMarket} note="rynek z najwyższym dodatnim edge" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
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
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Expected goals gospodarzy" value={formatNumber(metrics.expectedHomeGoals)} note={match.basic.homeTeam || "gospodarz"} tone="cyan" />
          <MetricCard label="Expected goals gości" value={formatNumber(metrics.expectedAwayGoals)} note={match.basic.awayTeam || "gość"} />
          <MetricCard label="Łączne expected goals" value={formatNumber(metrics.totalExpectedGoals)} note="suma modelowa" tone="gold" />
          <MetricCard label="Oczekiwane rożne" value={formatNumber(metrics.expectedCorners, 1)} note="łącznie" />
          <MetricCard label="Oczekiwane kartki" value={formatNumber(metrics.expectedCards, 1)} note="łącznie" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
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

          <section className="glass-card p-5">
            <h3 className="text-xl font-black text-white">Wyliczone średnie</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricCard label="Gole gospodarzy" value={formatNumber(metrics.averages.home.goalsForAvg)} note="średnia last5" />
              <MetricCard label="Gole gości" value={formatNumber(metrics.averages.away.goalsForAvg)} note="średnia last5" />
              <MetricCard label="Strzały gospodarzy" value={formatNumber(metrics.averages.home.shotsForAvg, 1)} note="średnia last5" />
              <MetricCard label="Strzały gości" value={formatNumber(metrics.averages.away.shotsForAvg, 1)} note="średnia last5" />
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-black text-white">Analiza kursów</h2>
          <MarketAnalysisTable metrics={metrics} />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TextPanel title="Scenariusze meczu" text={scenarioText} />
          <TextPanel title="Ryzyka" text={riskText} />
        </div>

        <section className="mt-8">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Premium</p>
              <h2 className="mt-2 text-2xl font-black text-white">Rozszerzone sekcje raportu</h2>
            </div>
            <PreviewModeToggle mode={mode} onChange={setMode} />
          </div>

          {mode === "premium" ? (
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
                  text="Zmień tryb podglądu na Premium, aby zobaczyć rozszerzoną sekcję raportu."
                />
              ))}
            </div>
          )}
        </section>

        <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
          {modelDisclaimer}
        </p>
      </div>
    </section>
  );
}
