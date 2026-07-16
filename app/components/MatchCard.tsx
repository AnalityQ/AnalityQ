import Link from "next/link";
import { localizeCompetitionName, localizePublicText, localizeTeamName } from "@/lib/countries";
import type { PublicAnalysisSummary } from "@/lib/public-analysis";
import { getRiskLabel, StatusBadge } from "./Badges";
import { CountryLabel, LeagueLogo, TeamLogo } from "./ApiImage";
import { FootballCtaMotion, FootballIcon } from "./FootballIcon";

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

export function MatchCard({ match }: { match: PublicAnalysisSummary }) {
  const leagueName = localizeCompetitionName(match.league.name) || "Rozgrywki";
  const homeName = localizeTeamName(match.homeTeam.name) || "Gospodarz";
  const awayName = localizeTeamName(match.awayTeam.name) || "Gość";

  return (
    <article className="match-card card-hover">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <LeagueLogo src={match.league.logo} alt={leagueName} size={42} />
          <div className="min-w-0">
          <p className="truncate text-sm text-slate-400">{leagueName}</p>
          <p className="mt-1 text-sm font-semibold text-cyan-100">{formatKickoff(match.basic.kickoff)}</p>
          <CountryLabel code={match.league.countryCode} name={match.league.country} />
          </div>
        </div>
        <StatusBadge status={match.basic.status} />
      </div>

      <div className="match-card-main">
        <div className="match-card-teams">
          <div><TeamLogo src={match.homeTeam.logo} alt={homeName} size={48} /><h3 title={homeName}>{homeName}</h3></div>
          <span>vs</span>
          <div><TeamLogo src={match.awayTeam.logo} alt={awayName} size={48} /><h3 title={awayName}>{awayName}</h3></div>
        </div>
        <p className="match-card-summary line-clamp-2">
          {localizePublicText(match.summary)}
        </p>
      </div>

      <div className="match-card-metrics">
        <div className="rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3">
          <p className="text-xs text-slate-400">Value Index</p>
          <p className="mt-1 text-xl font-black text-amber-100">{match.metrics.valueIndex === null ? "—" : Math.round(match.metrics.valueIndex)}</p>
        </div>
        <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/[0.05] p-3">
          <p className="text-xs text-slate-400">Poziom ryzyka</p>
          <p className="mt-1 text-sm font-bold text-white">{getRiskLabel(match.metrics.effectiveRiskLevel)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">Pewność analizy</p>
          <p className="mt-1 text-xl font-black text-cyan-100">{Math.round(match.metrics.confidence)}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">Kompletność</p>
          <p className="mt-1 text-xl font-black text-white">{match.metrics.completeness}%</p>
        </div>
      </div>

      {match.dataFact && <p className="match-card-fact"><FootballIcon name="signals" size={16} /><span><b>Z danych:</b> {localizePublicText(match.dataFact)}</span></p>}

      <div className="match-card-footer">
        <p className="text-xs leading-5 text-slate-500">
          Najlepszy sygnał value: {match.metrics.bestValueMarket}
        </p>
        <Link href={`/analizy/${match.slug}`} className="report-link w-fit">
          <span>Otwórz raport</span><FootballCtaMotion />
        </Link>
      </div>
    </article>
  );
}
