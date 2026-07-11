import Link from "next/link";
import { analysisAreas, audienceCards, pricingPlans } from "@/lib/analityq-data";
import { DataPipeline } from "./components/DataPipeline";
import { FAQAccordion } from "./components/FAQAccordion";
import { HeroDashboard } from "./components/HeroDashboard";
import { HomePublishedAnalyses } from "./components/HomePublishedAnalyses";
import { Logo } from "./components/Logo";
import { PricingCard } from "./components/PricingCard";
import { SectionHeader } from "./components/SectionHeader";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 data-grid-bg">
        <div className="section-shell grid gap-12 !py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:!py-20">
          <div className="animate-fade-up">
            <Logo href="" />
            <p className="eyebrow mt-8">Platforma analityczna</p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white md:text-6xl">
              AnalityQ — sportowe raporty statystyczne oparte na danych
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Analizy meczowe, prawdopodobieństwa modelowe, kursy, edge, ryzyko i scenariusze
              spotkania w jednym przejrzystym raporcie.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/analizy" className="btn-primary justify-center">
                Zobacz analizy
              </Link>
              <Link href="/jak-to-dziala" className="btn-secondary justify-center">
                Jak działa model
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ["Value", "Index"],
                ["edge", "przewaga modelu"],
                ["ryzyko", "ocena modelu"],
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
            eyebrow="Dzisiejsze raporty"
            title="Opublikowane analizy"
            description="Publicznie widoczne są wyłącznie raporty opublikowane w lokalnej bazie AnalityQ."
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
          description="Każdy raport łączy dane wejściowe, kursy, prawdopodobieństwo z kursu, edge, Value Index i ryzyko meczu."
          align="center"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          eyebrow="Jak działa model"
          title="Od danych wejściowych do raportu końcowego"
          description="Proces pokazuje, jak AnalityQ porządkuje statystyki, kursy, edge i ryzyko w jeden raport."
          align="center"
        />
        <div className="mt-12">
          <DataPipeline />
        </div>
      </section>

      <section className="section-shell">
        <SectionHeader
          eyebrow="Dla kogo"
          title="Dane meczowe w uporządkowanej formie"
          description="AnalityQ jest projektowane dla osób, które potrzebują czytelnego kontekstu, a nie chaotycznych notatek."
          align="center"
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {audienceCards.map((card) => (
            <article key={card.title} className="glass-card card-hover p-5">
              <h3 className="text-xl font-black text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.text}</p>
            </article>
          ))}
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
