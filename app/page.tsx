import Link from "next/link";
import { analysisAreas, pricingPlans } from "@/lib/analityq-data";
import { DataPipeline } from "./components/DataPipeline";
import { FAQAccordion } from "./components/FAQAccordion";
import { HeroDashboard } from "./components/HeroDashboard";
import { HomePublishedAnalyses } from "./components/HomePublishedAnalyses";
import { PricingCard } from "./components/PricingCard";
import { SectionHeader } from "./components/SectionHeader";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 data-grid-bg">
        <div className="section-shell grid gap-12 !py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:!py-20">
          <div className="animate-fade-up">
            <p className="eyebrow">AI Sports Analytics Platform</p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">
              AI Sports Analytics dla świadomych decyzji
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              AnalityQ porządkuje dane wejściowe, kursy, ryzyko i scenariusze
              meczu w prywatnym workflow admina. Publicznie widoczne są tylko
              opublikowane raporty.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/analizy" className="btn-primary justify-center">
                Zobacz analizy
              </Link>
              <Link href="/admin" className="btn-secondary justify-center">
                Panel admina
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["20", "slotów"],
                ["JSON", "import/export"],
                ["edge", "value signal"],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-reveal">
            <HeroDashboard />
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeader
            eyebrow="Dzisiejsze analizy"
            title="Opublikowane raporty"
            description="Sekcja pokazuje maksymalnie 6 raportów oznaczonych jako published. Brak seedowanych danych i brak pustych slotów publicznie."
          />
          <Link href="/analizy" className="btn-secondary w-fit">
            Pełna lista
          </Link>
        </div>
        <div className="mt-10">
          <HomePublishedAnalyses />
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Zakres analizy"
          title="Co analizuje AnalityQ?"
          description="Każdy raport łączy ręcznie wpisane dane, kursy, implied probability, modelowe prawdopodobieństwo, edge i ryzyko."
          align="center"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {analysisAreas.map((area) => (
            <article key={area.title} className="analysis-area-card card-hover">
              <span>{area.mark}</span>
              <h3 className="mt-5 font-black text-white">{area.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{area.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Jak działa AnalityQ?"
          title="Od danych wejściowych do własnej decyzji"
          description="Proces pokazuje, gdzie kończy się model pomocniczy, a zaczyna decyzja użytkownika."
          align="center"
        />
        <div className="mt-12">
          <DataPipeline />
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Premium"
          title="Pakiety przygotowane jako demo produktu"
          description="Trzy poziomy dostępu pokazują kierunek rozbudowy platformy bez uruchamiania płatności."
          align="center"
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="section-shell">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            eyebrow="FAQ"
            title="Najważniejsze pytania"
            description="Krótko i konkretnie o tym, czym jest AnalityQ i jak traktować raporty."
          />
          <FAQAccordion limit={5} />
        </div>
      </section>
    </>
  );
}
