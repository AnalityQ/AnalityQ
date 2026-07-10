"use client";

import { calculateFullReportMetrics } from "@/lib/calculations";
import type { MatchAnalysisRecord, NumericValue } from "@/lib/types";
import { RiskBadge } from "../Badges";
import { MarketAnalysisTable } from "../MarketAnalysisTable";
import { MetricCard } from "../MetricCard";
import { ValueIndexCard } from "../ValueIndexCard";

function formatNumber(value: NumericValue, digits = 2) {
  return value === null ? "brak danych" : value.toFixed(digits);
}

export function AdminLivePreview({ analysis }: { analysis: MatchAnalysisRecord }) {
  const metrics = calculateFullReportMetrics(analysis);

  return (
    <aside className="admin-live-preview">
      <p className="eyebrow">Wyliczenia modelu</p>
      <h2 className="mt-2 text-2xl font-black text-white">Podgląd na żywo</h2>

      <div className="mt-5">
        <ValueIndexCard
          value={metrics.valueIndex}
          description="Aktualizuje się po zmianie danych, kursów, pewności analizy i poziomu ryzyka."
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Poziom ryzyka</p>
            <p className="mt-1 text-xl font-black text-white">
              {analysis.settings.riskLevel === "auto" ? "Automatyczny" : "Ręcznie ustawiony"}
            </p>
          </div>
          <RiskBadge level={metrics.effectiveRiskLevel} />
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Kompletność danych: {Math.round(metrics.dataCompleteness.ratio * 100)}%.
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Expected goals gospodarzy" value={formatNumber(metrics.expectedHomeGoals)} note={analysis.basic.homeTeam || "gospodarz"} />
        <MetricCard label="Expected goals gości" value={formatNumber(metrics.expectedAwayGoals)} note={analysis.basic.awayTeam || "gość"} />
        <MetricCard label="Łączne expected goals" value={formatNumber(metrics.totalExpectedGoals)} note="suma modelowa" tone="cyan" />
        <MetricCard label="Oczekiwane rożne" value={formatNumber(metrics.expectedCorners, 1)} note="łącznie" />
        <MetricCard label="Oczekiwane kartki" value={formatNumber(metrics.expectedCards, 1)} note="łącznie" />
        <MetricCard
          label="Pewność analizy"
          value={`${Math.round(metrics.confidence)}%`}
          note={`automatycznie: ${Math.round(metrics.autoConfidence)}%`}
          tone="gold"
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm text-slate-400">Najlepszy sygnał value</p>
        <p className="mt-2 text-xl font-black text-white">{metrics.bestValueMarket}</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricCard label="Średnia goli gospodarzy" value={formatNumber(metrics.averages.home.goalsForAvg)} note="ostatnie 5 meczów" />
        <MetricCard label="Średnia goli gości" value={formatNumber(metrics.averages.away.goalsForAvg)} note="ostatnie 5 meczów" />
        <MetricCard label="Średnia strzałów gospodarzy" value={formatNumber(metrics.averages.home.shotsForAvg, 1)} note="ostatnie 5 meczów" />
        <MetricCard label="Średnia strzałów gości" value={formatNumber(metrics.averages.away.shotsForAvg, 1)} note="ostatnie 5 meczów" />
      </div>

      <div className="mt-5">
        <MarketAnalysisTable metrics={metrics} />
      </div>
    </aside>
  );
}
