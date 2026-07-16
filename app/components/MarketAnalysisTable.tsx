import type { FullReportMetrics, NumericValue } from "@/lib/types";
import { EdgeBadge } from "./Badges";

function formatPercent(value: NumericValue) {
  if (value === null) return "brak danych";
  return `${value.toFixed(1)}%`;
}

function formatOdds(value: NumericValue) {
  return value !== null && value > 0 ? value.toFixed(2) : "brak danych";
}

function formatEdge(value: NumericValue) {
  return value === null ? "brak danych" : `${value.toFixed(1)} pp`;
}

export function MarketAnalysisTable({ metrics }: { metrics: FullReportMetrics }) {
  return (
    <div className="model-market-shell">
      <div className="model-market-grid">
        {metrics.markets.map((market) => (
          <article key={market.key} className="model-market-card">
            <header>
              <h3>{market.label}</h3>
              <EdgeBadge status={market.status} edge={market.edge} />
            </header>
            <div className="model-market-values">
              <div><span>Model AnalityQ</span><strong>{formatPercent(market.model)}</strong></div>
              <div><span>Kurs</span><strong>{formatOdds(market.odds)}</strong></div>
            </div>
            <p>{market.edge === null ? "Brak kursu do porównania z modelem." : `Różnica model–kurs: ${formatEdge(market.edge)}`}</p>
          </article>
        ))}
      </div>
      <p className="model-market-note">Publiczny raport pokazuje wynik modelu, dostępny kurs i końcową ocenę rynku. Ręczne korekty nie są prezentowane.</p>
    </div>
  );
}
