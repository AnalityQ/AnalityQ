import { DataPipeline } from "../components/DataPipeline";
import { MetricCard } from "../components/MetricCard";
import { SectionHeader } from "../components/SectionHeader";

const dataCards = [
  ["Forma drużyn", "ostatnie mecze, serie, stabilność"],
  ["Statystyki", "xG, strzały, rożne, kartki"],
  ["Kontekst", "składy, absencje, stawka spotkania"],
  ["Historia", "H2H jako sygnał pomocniczy"],
];

const modelCards = [
  ["Ważenie danych", "Model pomocniczy ocenia, które metryki są stabilne."],
  ["Scenariusze", "Raport buduje kilka możliwych przebiegów meczu."],
  ["Ryzyko", "Zmienność jest opisana, a nie ukryta pod jedną liczbą."],
];

export default function JakToDzialaPage() {
  return (
    <>
      <section className="section-shell">
        <SectionHeader
          eyebrow="Proces"
          title="Jak działa model AnalityQ?"
          description="Platforma zbiera dane wejściowe, porządkuje je przez model pomocniczy, ocenia ryzyko i pokazuje raport końcowy."
          align="center"
        />
        <div className="mt-12">
          <DataPipeline />
        </div>
      </section>

      <section className="section-shell !pt-0">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow="Dane wejściowe"
              title="Sygnały z wielu warstw meczu"
              description="AnalityQ nie opiera raportu na jednym wskaźniku. Ważny jest układ danych i kontekst, który może zmienić interpretację."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {dataCards.map(([title, text]) => (
                <MetricCard key={title} label={title} value="DANE" note={text} tone="cyan" />
              ))}
            </div>
          </div>

          <div className="model-panel">
            <div className="orbit-ring" aria-hidden="true" />
            <p className="eyebrow">Model pomocniczy</p>
            <h2 className="mt-3 text-3xl font-black text-white">Porządkowanie sygnałów</h2>
            <div className="mt-8 grid gap-4">
              {modelCards.map(([title, text]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
                  <h3 className="font-black text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell !pt-0">
        <div className="output-report">
          <div>
            <p className="eyebrow">Raport końcowy</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">
              Raport zamiast uproszczonej odpowiedzi
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Wynikiem pracy AnalityQ jest widok, który pokazuje dane, ryzyko,
              scenariusze i uzasadnienie Value Index. To wspiera analizę, ale
              nie zastępuje samodzielnej decyzji użytkownika.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["Value Index", "Poziom ryzyka", "Scenariusze"].map((item) => (
              <div key={item} className="rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.05] p-4">
                <p className="text-sm text-slate-400">{item}</p>
                <p className="mt-2 text-xl font-black text-white">gotowe</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
