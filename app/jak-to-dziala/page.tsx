import Link from "next/link";
import { disclaimer } from "@/lib/analityq-data";
import { SectionHeader } from "../components/SectionHeader";

const steps = [
  {
    title: "Zbieramy kontekst meczu",
    text: "Łączymy ostatnią formę, wyniki u siebie i na wyjeździe, tabelę, statystyki, składy oraz absencje.",
  },
  {
    title: "Porównujemy obie drużyny",
    text: "Każda liczba jest czytana razem z wielkością próby. Brak danych pozostaje brakiem danych — nie zamieniamy go automatycznie na zero.",
  },
  {
    title: "Wskazujemy sygnały i ryzyka",
    text: "Raport pokazuje najmocniejsze zależności, ich podstawę oraz czynniki, które mogą zmienić obraz spotkania.",
  },
  {
    title: "Publikujemy czytelną historię meczu",
    text: "Przed publikacją analiza może zostać ręcznie sprawdzona i uzupełniona. Użytkownik dostaje jeden uporządkowany raport.",
  },
];

const reportLayers = [
  ["Forma", "Ostatnie spotkania i stabilność wyników."],
  ["Dom / wyjazd", "Różnice między grą u siebie i poza własnym stadionem."],
  ["Statystyki", "Gole, strzały, rożne, kartki i dostępne dane dodatkowe."],
  ["Składy", "Oficjalna jedenastka albo jawnie opisane przewidywanie."],
  ["Zawodnicy", "Minuty, gole, asysty, rating i wielkość próby."],
  ["Ryzyko", "Absencje, małe próbki, brak składów i sprzeczne sygnały."],
];

export default function JakToDzialaPage() {
  return (
    <>
      <section className="section-shell">
        <SectionHeader
          eyebrow="Jak działa AnalityQ"
          title="Dane zamienione w czytelny obraz meczu"
          description="AnalityQ porządkuje dostępne informacje, pokazuje ich jakość i pomaga szybko zrozumieć, co może mieć znaczenie przed pierwszym gwizdkiem."
          align="center"
        />
        <div className="mx-auto mt-12 grid max-w-5xl gap-4 md:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.title} className="glass-card p-6">
              <span className="text-xs font-black text-amber-200">KROK {String(index + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 text-xl font-black text-white">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell !pt-0">
        <SectionHeader
          eyebrow="W raporcie"
          title="Najważniejsze warstwy spotkania"
          description="Nie każda liga i każdy mecz oferują identyczny zestaw informacji. Raport zawsze komunikuje, co jest dostępne."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reportLayers.map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-black text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-shell !pt-0">
        <div className="rounded-3xl border border-cyan-200/15 bg-cyan-200/[0.045] p-6 md:p-10">
          <p className="eyebrow">Uczciwe wnioski</p>
          <h2 className="mt-3 max-w-3xl text-3xl font-black text-white md:text-5xl">Widzisz nie tylko wynik analizy, ale też jej ograniczenia.</h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">Wielkość próby, kompletność sekcji, status składów i wykryte ryzyka są częścią raportu. Dzięki temu mocny sygnał nie jest mylony z pewnym wynikiem.</p>
          <p className="mt-6 max-w-4xl rounded-2xl border border-white/10 bg-[#020713]/55 p-4 text-xs leading-6 text-slate-400">{disclaimer}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/analizy" className="btn-primary justify-center">Zobacz analizy</Link>
            <Link href="/premium" className="btn-secondary justify-center">Darmowy vs Premium</Link>
          </div>
        </div>
      </section>
    </>
  );
}
