"use client";

import { calculateFullReportMetrics } from "@/lib/calculations";
import type { MatchAnalysisRecord } from "@/lib/types";
import { MarketAnalysisTable } from "../MarketAnalysisTable";
import { MetricCard } from "../MetricCard";
import { ValueIndexCard } from "../ValueIndexCard";

export function AdminLivePreview({ analysis }: { analysis: MatchAnalysisRecord }) {
  const metrics = calculateFullReportMetrics(analysis);

  return (
    <aside className="admin-live-preview">
      <p className="eyebrow">Wyliczenia modelu</p>
      <h2 className="mt-2 text-2xl font-black text-white">Live preview</h2>

      <div className="mt-5">
        <ValueIndexCard value={metrics.valueIndex} description="Aktualizuje się po zmianie danych, kursów, confidence i ryzyka." />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Expected home goals" value={metrics.expectedHomeGoals.toFixed(2)} note={analysis.basic.homeTeam || "gospodarz"} />
        <MetricCard label="Expected away goals" value={metrics.expectedAwayGoals.toFixed(2)} note={analysis.basic.awayTeam || "gość"} />
        <MetricCard label="Total expected goals" value={metrics.totalExpectedGoals.toFixed(2)} note="suma xG modelu" tone="cyan" />
        <MetricCard label="Expected corners" value={metrics.expectedCorners.toFixed(1)} note="rożne łącznie" />
        <MetricCard label="Expected cards" value={metrics.expectedCards.toFixed(1)} note="kartki łącznie" />
        <MetricCard label="Confidence" value={`${Math.round(metrics.confidence)}%`} note={`auto: ${Math.round(metrics.autoConfidence)}%`} tone="gold" />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm text-slate-400">Best Value Market</p>
        <p className="mt-2 text-xl font-black text-white">{metrics.bestValueMarket}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Home avg goals" value={metrics.averages.home.goalsForAvg.toFixed(2)} note="średnia gospodarzy" />
        <MetricCard label="Away avg goals" value={metrics.averages.away.goalsForAvg.toFixed(2)} note="średnia gości" />
        <MetricCard label="Home avg shots" value={metrics.averages.home.shotsForAvg.toFixed(1)} note="strzały gospodarzy" />
        <MetricCard label="Away avg shots" value={metrics.averages.away.shotsForAvg.toFixed(1)} note="strzały gości" />
      </div>

      <div className="mt-5">
        <MarketAnalysisTable metrics={metrics} />
      </div>
    </aside>
  );
}
