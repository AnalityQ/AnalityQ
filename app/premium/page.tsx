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
          title="Rozbudowana wersja planów"
          description="Pakiety są częścią demonstracji produktu. Pokazują zakres przyszłych funkcji bez uruchamiania płatności."
          align="center"
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      <section className="section-shell !pt-0">
        <SectionHeader
          eyebrow="Porównanie"
          title="Free vs Premium vs Pro"
          description="Czytelny zakres dostępu do raportów, metryk i narzędzi pracy."
        />
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-slate-300">
                <th className="p-4 font-bold">Funkcja</th>
                <th className="p-4 font-bold">Free</th>
                <th className="p-4 font-bold text-amber-100">Premium</th>
                <th className="p-4 font-bold text-cyan-100">Pro</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, free, premium, pro]) => (
                <tr key={feature} className="border-b border-white/10 last:border-0">
                  <td className="p-4 font-semibold text-white">{feature}</td>
                  <td className="p-4 text-slate-300">{free}</td>
                  <td className="p-4 text-slate-300">{premium}</td>
                  <td className="p-4 text-slate-300">{pro}</td>
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
