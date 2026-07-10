import Link from "next/link";
import { calculateFullReportMetrics } from "@/lib/calculations";
import type { MatchAnalysisRecord } from "@/lib/types";
import { ConfidenceBadge, RiskBadge, StatusBadge } from "./Badges";

function formatKickoff(value: string) {
  if (!value) return "brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function MatchCard({ match }: { match: MatchAnalysisRecord }) {
  const metrics = calculateFullReportMetrics(match);

  return (
    <article className="match-card card-hover">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{match.basic.league || "Liga nieuzupełniona"}</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{formatKickoff(match.basic.kickoff)}</p>
        </div>
        <StatusBadge status={match.basic.status} />
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-black text-white">
          {match.basic.homeTeam || "Gospodarz"} <span className="text-slate-500">vs</span>{" "}
          {match.basic.awayTeam || "Gość"}
        </h3>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">
          {match.notes.summary || "Raport oparty o dane wejściowe, kursy, edge i kontekst meczowy."}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3">
          <p className="text-xs text-slate-400">Value Index</p>
          <p className="mt-1 text-xl font-black text-amber-100">{Math.round(metrics.valueIndex)}</p>
        </div>
        <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.05] p-3">
          <p className="text-xs text-slate-400">Risk</p>
          <p className="mt-1 text-sm font-bold text-white">{match.settings.riskLevel}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">Confidence</p>
          <p className="mt-1 text-xl font-black text-cyan-100">{Math.round(metrics.confidence)}%</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <RiskBadge level={match.settings.riskLevel} />
        <ConfidenceBadge value={metrics.confidence} />
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5">
        <p className="text-xs leading-5 text-slate-500">Best Value Market: {metrics.bestValueMarket}</p>
        <Link href={`/analizy/${match.slug}`} className="report-link w-fit">
          Otwórz raport
        </Link>
      </div>
    </article>
  );
}
