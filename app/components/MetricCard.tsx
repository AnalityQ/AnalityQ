type MetricCardProps = {
  label: string;
  value: string;
  note?: string;
  tone?: "cyan" | "gold" | "neutral";
};

export function MetricCard({ label, value, note, tone = "neutral" }: MetricCardProps) {
  const toneClass =
    tone === "cyan"
      ? "metric-cyan"
      : tone === "gold"
        ? "metric-gold"
        : "metric-neutral";

  return (
    <div className={`metric-card ${toneClass}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      {note && <p className="mt-2 text-xs leading-5 text-slate-400">{note}</p>}
    </div>
  );
}
