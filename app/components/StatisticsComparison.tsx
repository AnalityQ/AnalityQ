import type { FullReportMetrics, MatchAnalysisRecord, NumericValue } from "@/lib/types";

function value(number: NumericValue) {
  return number === null ? "—" : number.toFixed(2);
}

export function StatisticsComparison({ match, metrics }: { match: MatchAnalysisRecord; metrics: FullReportMetrics }) {
  const rows = [
    ["Gole", metrics.averages.home.goalsForAvg, metrics.averages.away.goalsForAvg],
    ["xG", metrics.averages.home.xgForAvg, metrics.averages.away.xgForAvg],
    ["Strzały", metrics.averages.home.shotsForAvg, metrics.averages.away.shotsForAvg],
    ["Rzuty rożne", metrics.averages.home.cornersForAvg, metrics.averages.away.cornersForAvg],
    ["Kartki", metrics.averages.home.cardsForAvg, metrics.averages.away.cardsForAvg],
  ] as const;

  return (
    <section className="glass-card p-5">
      <div className="flex items-end justify-between gap-4">
        <div><p className="eyebrow">Ostatnie 5 spotkań</p><h2 className="mt-2 text-2xl font-black text-white">Porównanie statystyk</h2></div>
        <p className="hidden text-xs text-slate-500 sm:block">wartości na mecz</p>
      </div>
      <div className="statistics-comparison mt-5">
        <div className="statistics-row statistics-head"><span>Metryka</span><strong>{match.basic.homeTeam || "Gospodarz"}</strong><strong>{match.basic.awayTeam || "Gość"}</strong></div>
        {rows.map(([label, home, away]) => <div className="statistics-row" key={label}><span>{label}</span><strong>{value(home)}</strong><strong>{value(away)}</strong></div>)}
      </div>
    </section>
  );
}
