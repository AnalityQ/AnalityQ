import type { FullReportMetrics } from "@/lib/types";
import { EdgeBadge } from "./Badges";

function formatPercent(value: number | null) {
  if (value === null) return "brak danych";
  return `${value.toFixed(1)}%`;
}

function formatOdds(value: number) {
  return value > 0 ? value.toFixed(2) : "brak danych";
}

export function MarketAnalysisTable({ metrics }: { metrics: FullReportMetrics }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-slate-300">
            <th className="p-4 font-bold">Rynek</th>
            <th className="p-4 font-bold">Kurs</th>
            <th className="p-4 font-bold">Implied %</th>
            <th className="p-4 font-bold">Model %</th>
            <th className="p-4 font-bold">Moja ocena %</th>
            <th className="p-4 font-bold">Użyte %</th>
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
              <td className="p-4 text-slate-100">{market.edge === null ? "brak danych" : `${market.edge.toFixed(1)} pp`}</td>
              <td className="p-4">
                <EdgeBadge status={market.status} edge={market.edge} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
