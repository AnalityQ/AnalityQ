import { FAQAccordion } from "../components/FAQAccordion";
import { SectionHeader } from "../components/SectionHeader";

export default function FAQPage() {
  return (
    <section className="section-shell">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <SectionHeader
          eyebrow="FAQ"
          title="Pełne FAQ"
          description="Odpowiedzi są napisane tak, jak powinien komunikować się realny produkt analityczny: konkretnie, bez sztucznych obietnic."
        />
        <FAQAccordion />
      </div>
    </section>
  );
}
