import Link from "next/link";
import { EmptyState } from "../components/EmptyState";

export default function DemoRaportuPage() {
  return (
    <section className="section-shell">
      <EmptyState
        title="Demo raportu zostało wyłączone"
        description="Raporty są teraz tworzone jako lokalne analizy i widoczne publicznie dopiero po publikacji."
        action={
          <Link href="/analizy" className="btn-primary justify-center">
            Przejdź do analiz
          </Link>
        }
      />
    </section>
  );
}
