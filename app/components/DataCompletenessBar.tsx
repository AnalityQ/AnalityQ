import type { DataCompleteness } from "@/lib/types";

export function DataCompletenessBar({
  completeness,
  compact = false,
}: {
  completeness: DataCompleteness;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "rounded-2xl border border-white/10 bg-white/[0.04] p-4"}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">Kompletność danych</p>
          <p className="mt-1 text-xs text-slate-400">{completeness.status}</p>
        </div>
        <strong className="text-xl text-cyan-100">{completeness.percent}%</strong>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Kompletność danych"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={completeness.percent}
      >
        <div className="data-line h-full rounded-full transition-[width] duration-300" style={{ width: `${completeness.percent}%` }} />
      </div>
    </div>
  );
}
