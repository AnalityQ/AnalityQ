"use client";

import { calculateFullReportMetrics } from "@/lib/calculations";
import type { MatchAnalysisRecord, NumericValue } from "@/lib/types";
import { getRiskLabel } from "../Badges";
import { DataCompletenessBar } from "../DataCompletenessBar";
import { ValueIndexCard } from "../ValueIndexCard";

function number(value: NumericValue, digits = 1) {
  return value === null ? "Uzupełnij dane" : value.toFixed(digits);
}

function percent(value: NumericValue) {
  return value === null ? "Uzupełnij dane" : `${value.toFixed(1)}%`;
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="preview-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function ModelLivePreview({ analysis }: { analysis: MatchAnalysisRecord }) {
  const metrics = calculateFullReportMetrics(analysis);

  return (
    <aside className="model-live-preview">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Podgląd modelu</p>
          <h2 className="mt-2 text-2xl font-black text-white">Wyniki na żywo</h2>
        </div>
        <span
          className="info-tooltip"
          title="Pewność analizy określa jakość i kompletność danych wejściowych, a nie gwarancję rezultatu."
          aria-label="Informacja o pewności analizy"
        >
          i
        </span>
      </div>

      <div className="mt-5">
        <DataCompletenessBar completeness={metrics.dataCompleteness} />
      </div>

      <div className="mt-4">
        <ValueIndexCard value={metrics.valueIndex} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PreviewMetric label="Oczekiwane gole" value={number(metrics.totalExpectedGoals, 2)} />
        <PreviewMetric label="Oczekiwane rożne" value={number(metrics.expectedCorners)} />
        <PreviewMetric label="Oczekiwane kartki" value={number(metrics.expectedCards)} />
        <PreviewMetric label="Najwyższy edge" value={metrics.maxPositiveEdge > 0 ? `${metrics.maxPositiveEdge.toFixed(1)} pp` : "Uzupełnij dane"} />
        <PreviewMetric label="Pewność analizy" value={`${Math.round(metrics.confidence)}%`} />
        <PreviewMetric label="Poziom ryzyka" value={getRiskLabel(metrics.effectiveRiskLevel)} />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm font-black text-white">Prawdopodobieństwa</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <PreviewMetric label="1" value={percent(metrics.modelProbabilities.homeWin)} />
          <PreviewMetric label="X" value={percent(metrics.modelProbabilities.draw)} />
          <PreviewMetric label="2" value={percent(metrics.modelProbabilities.awayWin)} />
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <PreviewMetric label="Powyżej 2,5" value={percent(metrics.modelProbabilities.over25)} />
          <PreviewMetric label="Poniżej 2,5" value={percent(metrics.modelProbabilities.under25)} />
          <PreviewMetric label="BTTS — tak" value={percent(metrics.modelProbabilities.bttsYes)} />
          <PreviewMetric label="BTTS — nie" value={percent(metrics.modelProbabilities.bttsNo)} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200/15 bg-amber-200/[0.06] p-4">
        <p className="text-xs text-slate-400">Najlepszy sygnał statystyczny</p>
        <p className="mt-2 font-black leading-6 text-amber-100">{metrics.bestValueMarket}</p>
      </div>
    </aside>
  );
}
