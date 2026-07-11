"use client";

import Link from "next/link";
import { calculateFullReportMetrics } from "@/lib/calculations";
import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { getRiskLabel, PublicationBadge } from "../Badges";
import { DataCompletenessBar } from "../DataCompletenessBar";

function formatDate(value: string) {
  if (!value) return "Brak daty";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function StudioAnalysisCard({
  match,
  onEdit,
  onDelete,
  onDuplicate,
  onStatus,
}: {
  match: MatchAnalysisRecord;
  onEdit: (match: MatchAnalysisRecord) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStatus: (id: string, status: PublicationStatus) => void;
}) {
  const metrics = calculateFullReportMetrics(match);
  return (
    <article className="studio-analysis-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-black text-cyan-100">Slot {String(match.slotNumber).padStart(2, "0")}</p><p className="mt-1 truncate text-sm text-slate-400">{match.basic.league || "Liga nieuzupełniona"}</p></div>
        <PublicationBadge status={match.publicationStatus} />
      </div>
      <h3 className="mt-4 text-xl font-black text-white">{match.basic.homeTeam || "Gospodarz"} <span className="text-slate-500">vs</span> {match.basic.awayTeam || "Gość"}</h3>
      <p className="mt-2 text-sm font-semibold text-cyan-100">{formatDate(match.basic.kickoff)}</p>
      <span className={`source-mode-badge source-${match.sourceMode}`}>{match.sourceMode === "api" ? "Pobrane z API" : match.sourceMode === "mixed" ? "API + korekty ręczne" : "Dane ręczne"}</span>
      <div className="mt-4"><DataCompletenessBar completeness={metrics.dataCompleteness} compact /></div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="studio-mini-metric"><span>Value Index</span><strong>{metrics.valueIndex === null ? "—" : Math.round(metrics.valueIndex)}</strong></div>
        <div className="studio-mini-metric"><span>Ryzyko</span><strong>{getRiskLabel(metrics.effectiveRiskLevel)}</strong></div>
        <div className="studio-mini-metric"><span>Pewność</span><strong>{Math.round(metrics.confidence)}%</strong></div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Ostatnia aktualizacja: {formatDate(match.updatedAt)}</p>
      <div className="studio-card-actions">
        <button type="button" onClick={() => onEdit(match)}>Edytuj</button>
        <Link href={`/analizy/${match.slug}`}>Otwórz raport</Link>
        {match.publicationStatus === "published" ? <button type="button" onClick={() => onStatus(match.id, "draft")}>Cofnij publikację</button> : <button type="button" onClick={() => onStatus(match.id, "published")}>Opublikuj</button>}
        {match.publicationStatus !== "archived" && <button type="button" onClick={() => onStatus(match.id, "archived")}>Zarchiwizuj</button>}
        <button type="button" onClick={() => onDuplicate(match.id)}>Duplikuj</button>
        <button type="button" className="danger" onClick={() => onDelete(match.id)}>Usuń</button>
      </div>
    </article>
  );
}
