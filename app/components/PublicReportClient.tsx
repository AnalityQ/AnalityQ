"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { getMatches } from "@/lib/storage";
import type { MatchAnalysisRecord } from "@/lib/types";
import { modelDisclaimer } from "@/lib/analityq-data";
import { ConfidenceBadge, RiskBadge, StatusBadge } from "./Badges";
import { EmptyState } from "./EmptyState";
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
        {text || "Brak notatek w tej sekcji."}
      </p>
    </section>
  );
}

export function PublicReportClient({ slug }: { slug: string }) {
  const [match, setMatch] = useState<MatchAnalysisRecord | null | undefined>(undefined);
  const [mode, setMode] = useState<"free" | "premium">("free");

  useEffect(() => {
    const load = () => {
      const found = getMatches().find((item) => item.slug === slug);
      setMatch(found || null);
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("analityq-storage", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("analityq-storage", load);
    };
  }, [slug]);

  const metrics = useMemo(() => (match ? calculateFullReportMetrics(match) : null), [match]);

  if (match === undefined) {
    return (
      <section className="section-shell">
        <div className="h-80 animate-soft-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
      </section>
    );
  }

  if (match === null) {
    return (
      <section className="section-shell">
        <EmptyState
          title="Nie znaleziono raportu."
          description="Raport nie istnieje w lokalnej bazie danych albo został usunięty."
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

  const premiumCards = [
    ["Rożne", match.premiumSections.cornersAnalysis],
    ["Kartki", match.premiumSections.cardsAnalysis],
    ["Strzały", match.premiumSections.shotsAnalysis],
    ["Połowy", match.premiumSections.halvesAnalysis],
    ["Advanced risk", match.premiumSections.advancedRisk],
    ["H2H advanced", match.premiumSections.h2hAdvanced],
    ["Składy advanced", match.premiumSections.lineupsAdvanced],
  ] as const;

  return (
    <section className="section-shell">
      <div className="report-surface">
        <div className="report-header">
          <div>
            <p className="eyebrow">Raport AnalityQ</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">
              {match.basic.homeTeam} vs {match.basic.awayTeam}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              {match.basic.league} · {match.basic.country || "kraj nieuzupełniony"} · {formatDate(match.basic.kickoff)}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusBadge status={match.basic.status} />
              <RiskBadge level={match.settings.riskLevel} />
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
              <p className="text-sm text-slate-400">Best Value Market</p>
              <p className="mt-2 text-2xl font-black text-white">{metrics.bestValueMarket}</p>
              <p className="mt-3 text-sm leading-6 text-slate-400">Tryb podglądu raportu</p>
              <div className="mt-4">
                <PreviewModeToggle mode={mode} onChange={setMode} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Expected home goals" value={metrics.expectedHomeGoals.toFixed(2)} note={match.basic.homeTeam} tone="cyan" />
          <MetricCard label="Expected away goals" value={metrics.expectedAwayGoals.toFixed(2)} note={match.basic.awayTeam} />
          <MetricCard label="Expected corners" value={metrics.expectedCorners.toFixed(1)} note="rożne łącznie" tone="gold" />
          <MetricCard label="Expected cards" value={metrics.expectedCards.toFixed(1)} note="kartki łącznie" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TextPanel title="Model summary" text={match.notes.summary || match.notes.finalAssessment} />
          <TextPanel title="Ryzyka" text={match.notes.keyRisks || match.settings.riskNote} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="glass-card p-5">
            <h3 className="text-xl font-black text-white">Forma drużyn</h3>
            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-3 font-bold text-white">{match.basic.homeTeam}</p>
                <FormBadges value={match.manualStats.home.formLast5} />
              </div>
              <div>
                <p className="mb-3 font-bold text-white">{match.basic.awayTeam}</p>
                <FormBadges value={match.manualStats.away.formLast5} />
              </div>
            </div>
          </section>

          <section className="glass-card p-5">
            <h3 className="text-xl font-black text-white">Wyliczone średnie</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricCard label={`${match.basic.homeTeam} gole`} value={metrics.averages.home.goalsForAvg.toFixed(2)} note="średnia last5" />
              <MetricCard label={`${match.basic.awayTeam} gole`} value={metrics.averages.away.goalsForAvg.toFixed(2)} note="średnia last5" />
              <MetricCard label={`${match.basic.homeTeam} strzały`} value={metrics.averages.home.shotsForAvg.toFixed(1)} note="średnia last5" />
              <MetricCard label={`${match.basic.awayTeam} strzały`} value={metrics.averages.away.shotsForAvg.toFixed(1)} note="średnia last5" />
            </div>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="mb-5 text-2xl font-black text-white">Analiza kursów</h2>
          <MarketAnalysisTable metrics={metrics} />
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <TextPanel title="Scenariusze" text={match.notes.scenarios} />
          <TextPanel title="Notatki" text={match.notes.generalStatsNotes || match.notes.workNotes} />
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
