import type { PublicationStatus, RiskLevel } from "@/lib/types";

const riskClass: Record<RiskLevel, string> = {
  low: "border-cyan-200/30 bg-cyan-200/10 text-cyan-100",
  medium: "border-amber-200/35 bg-amber-200/10 text-amber-100",
  high: "border-white/20 bg-white/10 text-slate-100",
};

const riskLabel: Record<RiskLevel, string> = {
  low: "low risk",
  medium: "medium risk",
  high: "high risk",
};

const publicationClass: Record<PublicationStatus, string> = {
  draft: "border-cyan-200/25 bg-cyan-200/10 text-cyan-100",
  published: "border-amber-200/35 bg-amber-200/10 text-amber-100",
  archived: "border-white/20 bg-white/10 text-slate-100",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`badge ${riskClass[level]}`}>Risk: {riskLabel[level]}</span>;
}

export function ConfidenceBadge({ value }: { value: number }) {
  return (
    <span className="badge border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
      {Math.round(value)}% Confidence
    </span>
  );
}

export function StatusBadge({ status }: { status: "free" | "premium" }) {
  const className =
    status === "premium"
      ? "border-amber-200/35 bg-amber-200/10 text-amber-100"
      : "border-cyan-200/30 bg-cyan-200/10 text-cyan-100";

  return <span className={`badge ${className}`}>{status}</span>;
}

export function PublicationBadge({ status }: { status: PublicationStatus }) {
  return <span className={`badge ${publicationClass[status]}`}>{status}</span>;
}

export function EdgeBadge({ status, edge }: { status: string; edge: number | null }) {
  const className =
    edge === null
      ? "border-white/15 bg-white/[0.04] text-slate-300"
      : edge > 8
        ? "border-amber-200/35 bg-amber-200/10 text-amber-100"
        : edge >= 3
          ? "border-cyan-200/30 bg-cyan-200/10 text-cyan-100"
          : edge >= 0
            ? "border-white/20 bg-white/10 text-slate-100"
            : "border-white/15 bg-white/[0.04] text-slate-400";

  return <span className={`badge ${className}`}>{status}</span>;
}
