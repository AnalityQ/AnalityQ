type ValueIndexCardProps = {
  value: number | null;
  label?: string;
  description?: string;
};

export function ValueIndexCard({
  value,
  label = "Value Index",
  description = "Ocena jakości sygnału analitycznego z uwzględnieniem edge, pewności analizy i ryzyka.",
}: ValueIndexCardProps) {
  const percent = value === null ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div className="value-card glass-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-5xl font-black text-white">
            {value === null ? "—" : Math.round(value)}
            {value !== null && <span className="text-xl text-slate-400">/100</span>}
          </p>
        </div>
        <span className="value-pulse" aria-hidden="true" />
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="data-line h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">
        {value === null ? "Uzupełnij statystyki obu drużyn i kursy, aby obliczyć wiarygodny indeks." : description}
      </p>
    </div>
  );
}
