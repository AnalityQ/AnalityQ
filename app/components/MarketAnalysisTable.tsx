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
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
      <table className="w-full min-w-[980px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-slate-300">
            <th className="p-4 font-bold">Rynek</th>
            <th className="p-4 font-bold">Kurs</th>
            <th className="p-4 font-bold">Prawdopodobieństwo z kursu</th>
            <th className="p-4 font-bold">Prawdopodobieństwo modelu</th>
            <th className="p-4 font-bold">Korekta ręczna %</th>
            <th className="p-4 font-bold">Użyte prawdopodobieństwo</th>
            <th className="p-4 font-bold">Edge</th>
            <th className="p-4 font-bold">Status</th>
          </tr>
        </thead>
        <tbody>
          {metrics.markets.map((market) => (
            <tr key={market.key} className="border-b border-white/10 last:border-0">
              <td className="p-4 font-semibold text-white">{market.label}</td>
              <td className="p-4 text-slate-300">{formatOdds(market.odds)}</td>
              <td className="p-4 text-slate-300">{formatPercent(market.implied)}</td>
              <td className="p-4 text-slate-300">{formatPercent(market.model)}</td>
              <td className="p-4 text-slate-300">{formatPercent(market.user)}</td>
              <td className="p-4 text-slate-100">{formatPercent(market.used)}</td>
              <td className="p-4 text-slate-100">{formatEdge(market.edge)}</td>
              <td className="p-4">
                <EdgeBadge status={market.status} edge={market.edge} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-white/10 px-4 py-3 text-xs leading-5 text-slate-400">
        Prawdopodobieństwo z kursu wynika bezpośrednio z jego wartości. Edge to przewaga
        prawdopodobieństwa modelowego nad prawdopodobieństwem z kursu dla danego rynku.
      </div>
    </div>
  );
}
