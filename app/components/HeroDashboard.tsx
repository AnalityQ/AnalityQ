import { RiskBadge } from "./Badges";
import { ValueIndexCard } from "./ValueIndexCard";

const trendRows = [
  ["implied probability", "auto", "prawdopodobieństwo wynikające z kursu"],
  ["Model %", "auto", "z danych ostatnich 5 meczów"],
  ["edge", "auto", "przewaga modelu nad kursem"],
  ["Watchlista", "auto", "Value Index 65+"],
];

export function HeroDashboard() {
  return (
    <div className="hero-dashboard analytics-gradient">
      <div className="scan-line" aria-hidden="true" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Podgląd raportu</p>
          <h2 className="mt-3 text-2xl font-black text-white md:text-3xl">
            Panel analityczny meczu
          </h2>
          <p className="mt-2 text-sm text-slate-400">Dane ręczne · Supabase · raport publiczny</p>
        </div>
        <RiskBadge level="medium" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <ValueIndexCard
          value={68}
          description="Przykładowy stan kalkulatora: edge, pewność analizy i ryzyko składają się na Value Index."
        />

        <div className="glass-card p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Pewność analizy</p>
              <p className="mt-1 text-3xl font-black text-white">auto / ręczna</p>
            </div>
            <div className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-4 py-2 text-sm font-bold text-cyan-100">
              model pomocniczy
            </div>
          </div>

          <div className="mt-6 grid h-32 grid-cols-10 items-end gap-2" aria-label="Wykres danych">
            {[38, 52, 48, 64, 59, 72, 68, 81, 76, 88].map((height, index) => (
              <span
                key={height + index}
                className="form-bar"
                style={{ height: `${height}%`, animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_0.9fr]">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white">Wyliczenia</h3>
            <span className="h-2 w-2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(165,243,252,0.85)]" />
          </div>
          <div className="mt-4 divide-y divide-white/10">
            {trendRows.map(([label, value, note]) => (
              <div key={label} className="grid grid-cols-[0.8fr_0.6fr_1fr] gap-3 py-3 text-sm">
                <span className="text-slate-400">{label}</span>
                <span className="font-bold text-white">{value}</span>
                <span className="text-slate-500">{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card animate-float p-5">
          <h3 className="font-black text-white">Scenariusze raportu</h3>
          <div className="mt-4 space-y-3">
            {["Dane wejściowe", "Kursy i edge", "Ryzyka i notatki"].map((item, index) => (
              <div key={item} className="scenario-row">
                <span>{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
