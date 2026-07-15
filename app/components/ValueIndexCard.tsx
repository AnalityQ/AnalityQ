type ValueIndexCardProps = {
  value: number | null;
  label?: string;
  description?: string;
};

export function ValueIndexCard({
  value,
  label = "Value Index",
  description = "Syntetyczna ocena edge, jakości danych i ryzyka.",
}: ValueIndexCardProps) {
  const percent = value === null ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div className="value-card glass-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="value-card-number">
            {value === null ? "—" : Math.round(value)}
            {value !== null && <span className="text-xl text-slate-400">/100</span>}
          </p>
        </div>
        <span className="value-pulse" aria-hidden="true" />
      </div>
      <div className="value-card-track">
        <div className="data-line h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <p className="value-card-description">
        {value === null ? "Brak wiarygodnego wyniku — uzupełnij statystyki i kursy." : description}
      </p>
    </div>
  );
}
