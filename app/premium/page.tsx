import Link from "next/link";
import { comparisonRows, pricingPlans } from "@/lib/analityq-data";
import { PricingCard } from "../components/PricingCard";
import { SectionHeader } from "../components/SectionHeader";

export default function PremiumPage() {
  return (
    <>
      <section className="section-shell">
        <SectionHeader
          eyebrow="Premium"
          title="Wybierz poziom szczegółowości"
          description="Darmowy dostęp daje szybki obraz meczu. Premium za 29,99 zł miesięcznie rozszerzy raport o pełny kontekst — płatności nie są jeszcze uruchomione."
          align="center"
        />
        <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-2">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="section-shell !pt-0">
        <SectionHeader
          eyebrow="Porównanie"
          title="Darmowy vs Premium"
          description="Jasny zakres sekcji dostępnych w obu wariantach."
        />
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-300">
                <th className="p-4 font-bold">Funkcja</th>
                <th className="p-4 font-bold">Darmowy</th>
                <th className="p-4 font-bold text-amber-100">Premium</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, free, premium]) => (
                <tr key={feature} className="border-b border-white/10 last:border-0">
                  <td className="p-4 font-semibold text-white">{feature}</td>
                  <td className="p-4 text-slate-300">{free}</td>
                  <td className="p-4 text-slate-300">{premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/analizy" className="btn-primary justify-center">
            Zobacz analizy
          </Link>
        </div>
      </section>
    </>
  );
}
