import Link from "next/link";
import { EmptyState } from "../components/EmptyState";

export default function DemoRaportuPage() {
  return (
    <section className="section-shell">
      <EmptyState
        title="Demo raportu zostało wyłączone"
        description="Raporty są teraz tworzone ręcznie w panelu admina i widoczne publicznie dopiero po publikacji. Przejdź do listy analiz albo utwórz pierwszy raport w panelu."
        action={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/analizy" className="btn-secondary justify-center">
              Analizy
            </Link>
            <Link href="/admin" className="btn-primary justify-center">
              Panel admina
            </Link>
          </div>
        }
      />
    </section>
  );
}
