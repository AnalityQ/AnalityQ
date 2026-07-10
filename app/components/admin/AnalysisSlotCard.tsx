"use client";

import Link from "next/link";
import { calculateFullReportMetrics } from "@/lib/calculations";
import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { PublicationBadge, RiskBadge } from "../Badges";

function formatSlot(slot: number) {
  return String(slot).padStart(2, "0");
}

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

export function AnalysisSlotCard({
  slotNumber,
  match,
  onAdd,
  onEdit,
  onDelete,
  onStatus,
}: {
  slotNumber: number;
  match?: MatchAnalysisRecord;
  onAdd: (slot: number) => void;
  onEdit: (match: MatchAnalysisRecord) => void;
  onDelete: (id: string) => void;
  onStatus: (id: string, status: PublicationStatus) => void;
}) {
  if (!match) {
    return (
      <article className="empty-slot-card">
        <p className="text-sm font-black text-cyan-100">Slot {formatSlot(slotNumber)}</p>
        <h3 className="mt-5 text-xl font-black text-white">Oczekuje na dane</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Dodaj mecz, statystyki i kursy, aby utworzyć raport AnalityQ.
        </p>
        <button type="button" className="btn-secondary mt-6 w-full justify-center" onClick={() => onAdd(slotNumber)}>
          Dodaj analizę
        </button>
      </article>
    );
  }

  const metrics = calculateFullReportMetrics(match);
  const nextStatus = match.publicationStatus === "published" ? "draft" : "published";

  return (
    <article className="match-card card-hover">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-cyan-100">Slot {formatSlot(slotNumber)}</p>
          <p className="mt-1 text-sm text-slate-400">{match.basic.league || "Liga nieuzupełniona"}</p>
        </div>
        <PublicationBadge status={match.publicationStatus} />
      </div>

      <h3 className="mt-5 text-xl font-black text-white">
        {match.basic.homeTeam || "Gospodarz"} <span className="text-slate-500">vs</span>{" "}
        {match.basic.awayTeam || "Gość"}
      </h3>
      <p className="mt-2 text-sm text-cyan-100">{formatKickoff(match.basic.kickoff)}</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-200/15 bg-amber-200/[0.06] p-3">
          <p className="text-xs text-slate-400">Value Index</p>
          <p className="mt-1 text-xl font-black text-amber-100">{Math.round(metrics.valueIndex)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs text-slate-400">Confidence</p>
          <p className="mt-1 text-xl font-black text-cyan-100">{Math.round(metrics.confidence)}%</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <RiskBadge level={match.settings.riskLevel} />
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-400">Best Value Market: {metrics.bestValueMarket}</p>

      <div className="mt-6 grid gap-2">
        <button type="button" className="btn-secondary justify-center" onClick={() => onEdit(match)}>
          Edytuj
        </button>
        <Link href={`/analizy/${match.slug}`} className="btn-secondary justify-center">
          Otwórz raport
        </Link>
        <button type="button" className="btn-primary justify-center" onClick={() => onStatus(match.id, nextStatus)}>
          {match.publicationStatus === "published" ? "Cofnij publikację" : "Opublikuj"}
        </button>
        <button type="button" className="btn-secondary justify-center" onClick={() => onStatus(match.id, "archived")}>
          Archiwizuj
        </button>
        <button type="button" className="btn-secondary justify-center" onClick={() => onDelete(match.id)}>
          Usuń
        </button>
      </div>
    </article>
  );
}
