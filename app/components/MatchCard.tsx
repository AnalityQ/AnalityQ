import Link from "next/link";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { generateModelSummary } from "@/lib/reportText";
import type { MatchAnalysisRecord } from "@/lib/types";
import { ConfidenceBadge, getRiskLabel, RiskBadge, StatusBadge } from "./Badges";
import { DataCompletenessBar } from "./DataCompletenessBar";
import { CountryLabel, LeagueLogo, TeamLogo } from "./ApiImage";

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
  const summary = match.notes.summary.trim() || generateModelSummary(match, metrics);
  const snapshot = match.dataSource?.snapshot;

  return (
    <article className="match-card card-hover">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LeagueLogo src={snapshot?.fixture.leagueLogo} alt={match.basic.league || "Rozgrywki"} size={38} />
          <div className="min-w-0">
          <p className="truncate text-sm text-slate-400">{match.basic.league || "Liga nieuzupełniona"}</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{formatKickoff(match.basic.kickoff)}</p>
          {snapshot && <CountryLabel code={snapshot.fixture.countryCode} name={snapshot.fixture.countryName} />}
          </div>
        </div>
        <StatusBadge status={match.basic.status} />
      </div>

      <div className="mt-6">
        <div className="match-card-teams">
          <div><TeamLogo src={snapshot?.fixture.homeTeam.logo} alt={match.basic.homeTeam || "Gospodarz"} size={42} /><h3>{match.basic.homeTeam || "Gospodarz"}</h3></div>
          <span>vs</span>
          <div><TeamLogo src={snapshot?.fixture.awayTeam.logo} alt={match.basic.awayTeam || "Gość"} size={42} /><h3>{match.basic.awayTeam || "Gość"}</h3></div>
        </div>
        <p className="mt-3 line-clamp-3 min-h-16 text-sm leading-6 text-slate-400">
          {summary}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3">
          <p className="text-xs text-slate-400">Value Index</p>
          <p className="mt-1 text-xl font-black text-amber-100">{metrics.valueIndex === null ? "—" : Math.round(metrics.valueIndex)}</p>
        </div>
        <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.05] p-3">
          <p className="text-xs text-slate-400">Poziom ryzyka</p>
          <p className="mt-1 text-sm font-bold text-white">{getRiskLabel(metrics.effectiveRiskLevel)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">Pewność analizy</p>
          <p className="mt-1 text-xl font-black text-cyan-100">{Math.round(metrics.confidence)}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">Kompletność</p>
          <p className="mt-1 text-xl font-black text-white">{metrics.dataCompleteness.percent}%</p>
        </div>
      </div>

      <div className="mt-4"><DataCompletenessBar completeness={metrics.dataCompleteness} compact /></div>

      <div className="mt-5 flex flex-wrap gap-2">
        <RiskBadge level={metrics.effectiveRiskLevel} />
        <ConfidenceBadge value={metrics.confidence} />
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-5">
        <p className="text-xs leading-5 text-slate-500">
          Najlepszy sygnał value: {metrics.bestValueMarket}
        </p>
        <Link href={`/analizy/${match.slug}`} className="report-link w-fit">
          Otwórz raport
        </Link>
      </div>
    </article>
  );
}
