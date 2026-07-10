import { PublicAnalysisList } from "../components/PublicAnalysisList";
import { SectionHeader } from "../components/SectionHeader";

export default function AnalizyPage() {
  return (
    <section className="section-shell">
      <SectionHeader
        eyebrow="Raporty publiczne"
        title="Analizy meczów"
        description="Publiczny widok pokazuje wyłącznie raporty dodane przez admina i oznaczone jako published."
      />
      <PublicAnalysisList />
    </section>
  );
}
