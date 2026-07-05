"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [match, setMatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(false);

  const reportRef = useRef<HTMLDivElement | null>(null);

  const teams = getTeams(match);
  const homeTeam = teams.home;
  const awayTeam = teams.away;

  function getTeams(value: string) {
    const separators = [" vs ", " VS ", " - ", "-", " v ", " V "];
    let home = "Liverpool";
    let away = "Arsenal";

    for (const separator of separators) {
      if (value.includes(separator)) {
        const parts = value.split(separator);
        home = parts[0]?.trim() || home;
        away = parts[1]?.trim() || away;
        break;
      }
    }

    if (!value.includes("vs") && !value.includes("VS") && !value.includes("-")) {
      const words = value.trim().split(" ");
      if (words.length >= 2) {
        home = words[0];
        away = words.slice(1).join(" ");
      }
    }

    return { home, away };
  }

  function handleAnalyze() {
    if (!match.trim()) return;

    setAnalysis(false);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setAnalysis(true);

      setTimeout(() => {
        reportRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }, 1800);
  }

  function handleNewAnalysis() {
    setMatch("");
    setAnalysis(false);
    setLoading(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#031022] via-[#063C86] to-[#020817] text-white">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#031022]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-xl font-black tracking-tight">
            Anality<span className="text-[#F6C343]">Q</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
            <a className="transition hover:text-[#F6C343]" href="#">
              Funkcje
            </a>
            <a className="transition hover:text-[#F6C343]" href="#">
              Cennik
            </a>
            <a className="transition hover:text-[#F6C343]" href="#">
              O nas
            </a>
          </nav>

          <button className="rounded-full bg-[#F6C343] px-5 py-2 text-sm font-bold text-[#031022] shadow-lg shadow-[#F6C343]/40 transition duration-300 hover:scale-105 hover:bg-[#ffdc6b]">
            Rozpocznij
          </button>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="absolute left-1/2 top-20 h-[540px] w-[540px] -translate-x-1/2 rounded-full bg-cyan-300/20 blur-[115px]" />
        <div className="absolute left-1/2 top-32 h-[430px] w-[430px] -translate-x-1/2 rounded-full bg-[#F6C343]/20 blur-[105px]" />
        <div className="absolute bottom-10 left-10 h-80 w-80 rounded-full bg-blue-300/20 blur-[100px]" />
        <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-[#8EEBFF]/20 blur-[110px]" />

        <div className="relative z-10 w-full max-w-6xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#F6C343]/50 bg-[#F6C343]/10 px-5 py-2 text-sm font-semibold text-[#F6C343] shadow-lg shadow-[#F6C343]/20 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#F6C343] shadow-[0_0_14px_#F6C343]" />
            AI Sports Intelligence Platform
          </div>

          <h1 className="mx-auto mb-0 max-w-5xl text-[30px] font-black leading-tight tracking-tight md:text-[52px]">
            Inteligentna analiza{" "}
            <span className="text-[#F6C343] drop-shadow-[0_0_20px_rgba(246,195,67,0.35)]">
              meczów sportowych
            </span>
          </h1>

          <div className="relative mx-auto -mb-24 mt-1 w-fit">
            <div className="absolute inset-0 rounded-full bg-[#8EEBFF]/25 blur-3xl" />
            <img
              src="/logo.png"
              alt="Logo AnalityQ"
              className="relative mx-auto w-[440px] max-w-[92vw] drop-shadow-[0_0_75px_rgba(142,235,255,0.58)] transition duration-500 hover:scale-105 md:w-[530px]"
            />
          </div>

          <div className="relative z-20 mx-auto mt-0 flex max-w-2xl flex-col gap-4 rounded-3xl border border-cyan-200/20 bg-white/10 p-4 shadow-2xl shadow-cyan-400/20 backdrop-blur-xl transition duration-300 hover:border-[#F6C343]/40 hover:shadow-[#F6C343]/20 md:flex-row">
            <input
              value={match}
              onChange={(e) => setMatch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnalyze();
              }}
              className="flex-1 rounded-2xl border border-white/10 bg-[#06142F]/90 px-5 py-4 text-white outline-none transition placeholder:text-white/40 focus:border-[#F6C343]/70 focus:ring-2 focus:ring-[#F6C343]/25"
              placeholder="Wpisz mecz... np. Liverpool vs Arsenal"
            />

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="rounded-2xl bg-[#F6C343] px-8 py-4 font-bold text-[#031022] shadow-lg shadow-[#F6C343]/40 transition duration-300 hover:scale-105 hover:bg-[#ffdc6b] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Analizuję..." : "Analizuj"}
            </button>
          </div>

          {loading && (
            <div className="relative z-20 mx-auto mt-8 max-w-2xl rounded-3xl border border-cyan-200/20 bg-white/10 p-6 shadow-2xl shadow-cyan-400/20 backdrop-blur-xl">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#F6C343]" />
              <p className="font-bold text-[#F6C343]">
                AI analizuje wydarzenie...
              </p>
              <p className="mt-2 text-sm text-white/60">
                Sprawdzam formę, H2H, gole, rożne, kartki, strzały i
                scenariusze meczu.
              </p>
            </div>
          )}

          {analysis && !loading && (
            <div
              ref={reportRef}
              className="relative z-20 mx-auto mt-8 max-w-6xl rounded-3xl border border-[#F6C343]/30 bg-white/10 p-6 text-left shadow-2xl shadow-[#F6C343]/15 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#F6C343]">
                    Raport AnalityQ
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
                    {homeTeam} vs {awayTeam}
                  </h2>
                  <p className="mt-2 text-sm text-white/55">
                    Pełna analiza demo: wynik, gole, rożne, kartki, strzały,
                    H2H, forma i scenariusze AI.
                  </p>
                </div>

                <div className="rounded-3xl border border-[#F6C343]/30 bg-[#F6C343]/10 px-6 py-4 text-center shadow-lg shadow-[#F6C343]/20">
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
                    Value Index
                  </p>
                  <p className="mt-1 text-4xl font-black text-[#F6C343]">
                    7.8/10
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <StatCard
                  title="AI Score"
                  value="84%"
                  subtitle="pewność modelu"
                  info="AI Score pokazuje ogólną ocenę jakości analizy. Docelowo będzie liczony z formy drużyn, średnich sezonowych, ostatnich 5 meczów, H2H, przewagi boiska i stylu gry."
                />
                <StatCard
                  title="Ryzyko"
                  value="Średnie"
                  subtitle="mecz dynamiczny"
                  info="Ryzyko określa, jak bardzo mecz może być nieprzewidywalny. Wpływają na to rotacje, kontuzje, styl gry, stawka meczu, sędzia i zmienność formy drużyn."
                />
                <StatCard
                  title="Prognoza"
                  value="2:1 / 1:1"
                  subtitle="najbardziej realne"
                  info="Prognoza wyniku jest scenariuszem, a nie gwarancją. Powstaje z przewidywanej liczby goli, formy ofensywnej i defensywnej oraz H2H."
                />
                <StatCard
                  title="BTTS"
                  value="62%"
                  subtitle="obie strzelą"
                  info="BTTS oznacza, czy obie drużyny strzelą gola. Liczone z regularności zdobywania i tracenia bramek, xG, formy ataku i obrony oraz H2H."
                />
              </div>

              <SectionTitle title="1X2 i podwójna szansa" />

              <div className="grid gap-4 md:grid-cols-3">
                <ProbabilityCard
                  label={homeTeam}
                  value="52%"
                  info={`Szansa na zwycięstwo ${homeTeam}. Docelowo liczona z formy sezonowej, ostatnich 5 meczów, przewagi boiska, H2H, kontuzji i jakości ofensywno-defensywnej.`}
                />
                <ProbabilityCard
                  label="Remis"
                  value="26%"
                  color="cyan"
                  info="Szansa na remis. Model bierze pod uwagę wyrównanie drużyn, styl gry, średnią goli, liczbę remisów w sezonie i przebieg ostatnich spotkań."
                />
                <ProbabilityCard
                  label={awayTeam}
                  value="22%"
                  color="blue"
                  info={`Szansa na zwycięstwo ${awayTeam}. Docelowo liczona z formy wyjazdowej, jakości ataku, defensywy, H2H i kontekstu meczu.`}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <MiniCard
                  title="1X"
                  value="78%"
                  text={`${homeTeam} wygra lub remis`}
                  info="Podwójna szansa 1X oznacza, że gospodarze nie przegrają. Liczone przez połączenie szansy zwycięstwa gospodarzy i remisu."
                />
                <MiniCard
                  title="X2"
                  value="48%"
                  text={`${awayTeam} wygra lub remis`}
                  info="Podwójna szansa X2 oznacza, że goście nie przegrają. Liczone przez połączenie szansy remisu i zwycięstwa gości."
                />
                <MiniCard
                  title="12"
                  value="74%"
                  text="mecz bez remisu"
                  info="12 oznacza, że któraś drużyna wygra. Przydatne, gdy model widzi wysoką szansę rozstrzygnięcia i niższą szansę remisu."
                />
              </div>

              <SectionTitle title="Gole w meczu" />

              <div className="grid gap-4 md:grid-cols-4">
                <MiniCard
                  title="Over 1.5"
                  value="78%"
                  text="powyżej 1.5 gola"
                  info="Over 1.5 jest liczony z sumy średnich goli drużyn, ostatnich 5 meczów, H2H, xG i regularności strzelania."
                />
                <MiniCard
                  title="Over 2.5"
                  value="58%"
                  text="powyżej 2.5 gola"
                  info="Over 2.5 opiera się na trendach bramkowych, jakości ofensywy, słabościach defensywy, H2H i tempie gry."
                />
                <MiniCard
                  title="Under 2.5"
                  value="42%"
                  text="poniżej 2.5 gola"
                  info="Under 2.5 rośnie, gdy drużyny grają ostrożnie, mają niskie xG, mało strzałów celnych albo mecz ma dużą stawkę."
                />
                <MiniCard
                  title="Under 3.5"
                  value="68%"
                  text="poniżej 3.5 gola"
                  info="Under 3.5 oznacza, że model nie spodziewa się bardzo wysokiego wyniku. Liczone z rozkładu goli i stylu obu drużyn."
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team={homeTeam}
                  items={[
                    "Gol drużyny: 78%",
                    "Over 1.5 gola drużyny: 46%",
                    "Przewidywane gole: 1–2",
                    "Największe zagrożenie: stałe fragmenty i szybki atak",
                  ]}
                />

                <TeamPanel
                  team={awayTeam}
                  items={[
                    "Gol drużyny: 69%",
                    "Over 1.5 gola drużyny: 35%",
                    "Przewidywane gole: 0–2",
                    "Największe zagrożenie: kontrataki i skrzydła",
                  ]}
                />
              </div>

              <SectionTitle title="Analiza połówek" />

              <div className="grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team="1. połowa"
                  items={[
                    "Over 0.5 gola: 61%",
                    "Over 1.5 gola: 28%",
                    `${homeTeam} gol w 1. połowie: 39%`,
                    `${awayTeam} gol w 1. połowie: 31%`,
                    "Rzuty rożne 1. połowa over 3.5: 63%",
                  ]}
                />

                <TeamPanel
                  team="2. połowa"
                  items={[
                    "Over 0.5 gola: 72%",
                    "Over 1.5 gola: 41%",
                    `${homeTeam} gol w 2. połowie: 48%`,
                    `${awayTeam} gol w 2. połowie: 42%`,
                    "Większe tempo i więcej przestrzeni pod koniec meczu",
                  ]}
                />
              </div>

              <SectionTitle title="Rzuty rożne" />

              <div className="grid gap-4 md:grid-cols-3">
                <MiniCard
                  title="Rożne łącznie"
                  value="9–11"
                  text="przewidywany zakres"
                  info="Rzuty rożne są liczone z liczby ataków, strzałów blokowanych, gry skrzydłami, średnich sezonowych i ostatnich 5 spotkań."
                />
                <MiniCard
                  title="Over 8.5"
                  value="61%"
                  text="łączna linia rożnych"
                  info="Over 8.5 rożnych oznacza szansę na minimum 9 rzutów rożnych w meczu. Model analizuje styl ofensywny obu drużyn."
                />
                <MiniCard
                  title="Over 9.5"
                  value="49%"
                  text="bardziej ryzykowna linia"
                  info="Over 9.5 jest trudniejszą linią, dlatego procent jest niższy. Wpływają na nią tempo meczu, pressing i liczba akcji bocznymi sektorami."
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team={`${homeTeam} rożne`}
                  items={[
                    "Średnia sezonu: 6.1",
                    "Ostatnie 5 meczów: 6.8",
                    "Przewidywany zakres: 5–7",
                    "1. połowa over 1.5 rożnego: 67%",
                  ]}
                />

                <TeamPanel
                  team={`${awayTeam} rożne`}
                  items={[
                    "Średnia sezonu: 5.4",
                    "Ostatnie 5 meczów: 4.9",
                    "Przewidywany zakres: 4–6",
                    "1. połowa over 1.5 rożnego: 54%",
                  ]}
                />
              </div>

              <SectionTitle title="Kartki i dyscyplina" />

              <div className="grid gap-4 md:grid-cols-4">
                <MiniCard
                  title="Kartki łącznie"
                  value="3–5"
                  text="przewidywany zakres"
                  info="Kartki są liczone z agresywności drużyn, fauli, historii H2H, stawki meczu i docelowo profilu sędziego."
                />
                <MiniCard
                  title="Over 2.5"
                  value="71%"
                  text="kartki w meczu"
                  info="Over 2.5 kartek rośnie przy intensywnych meczach, derbach, wysokiej stawce i drużynach często faulujących."
                />
                <MiniCard
                  title="Over 3.5"
                  value="54%"
                  text="kartki w meczu"
                  info="Over 3.5 jest bardziej ryzykowne. Model bierze pod uwagę średnią kartek, H2H, pressing i styl sędziego."
                />
                <MiniCard
                  title="Czerwona kartka"
                  value="8%"
                  text="zdarzenie rzadkie"
                  info="Czerwona kartka to zdarzenie losowe. Procent zwykle jest niski i zależy od agresji, historii kartek i stylu sędziego."
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team={`${homeTeam} kartki`}
                  items={[
                    "Przewidywane kartki: 1–2",
                    "Ryzyko kartki w 1. połowie: średnie",
                    "Największe ryzyko: środek pola",
                  ]}
                />

                <TeamPanel
                  team={`${awayTeam} kartki`}
                  items={[
                    "Przewidywane kartki: 1–2",
                    "Ryzyko kartki w 1. połowie: średnie",
                    "Największe ryzyko: obrona boczna",
                  ]}
                />
              </div>

              <SectionTitle title="Strzały i strzały celne" />

              <div className="grid gap-4 md:grid-cols-3">
                <MiniCard
                  title="Strzały łącznie"
                  value="23–29"
                  text="cały mecz"
                  info="Strzały ogólne są liczone z tempa gry, średnich strzałów drużyn, posiadania piłki, stylu ofensywnego i jakości przeciwnika."
                />
                <MiniCard
                  title="Strzały celne"
                  value="9–13"
                  text="cały mecz"
                  info="Strzały celne są mocniejszym wskaźnikiem jakości ofensywy. Liczone z celności, xG, formy napastników i obrony rywala."
                />
                <MiniCard
                  title="Tempo ofensywne"
                  value="Wysokie"
                  text="dużo akcji pod bramką"
                  info="Tempo ofensywne pokazuje, czy mecz powinien generować dużo sytuacji. Wpływają na nie pressing, styl gry i liczba ataków."
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team={`${homeTeam} strzały`}
                  items={[
                    "Strzały ogólne: 13–16",
                    "Strzały celne: 5–7",
                    "Over 4.5 celnych: 64%",
                    "Największy potencjał: pierwsze 30 minut i stałe fragmenty",
                  ]}
                />

                <TeamPanel
                  team={`${awayTeam} strzały`}
                  items={[
                    "Strzały ogólne: 10–13",
                    "Strzały celne: 4–6",
                    "Over 3.5 celnych: 58%",
                    "Największy potencjał: kontrataki i druga połowa",
                  ]}
                />
              </div>

              <SectionTitle title="Zdarzenia specjalne" />

              <div className="grid gap-4 md:grid-cols-3">
                <MiniCard
                  title="Rzut karny"
                  value="18%"
                  text="szansa w meczu"
                  info="Szansa na karnego jest liczona z liczby wejść w pole karne, dryblingów, fauli w polu karnym i stylu obrony."
                />
                <MiniCard
                  title="Gol samobójczy"
                  value="3%"
                  text="bardzo losowe zdarzenie"
                  info="Gol samobójczy jest bardzo losowy, dlatego procent jest niski. Może rosnąć przy dużej presji, dośrodkowaniach i chaosie w polu karnym."
                />
                <MiniCard
                  title="VAR / kontrowersja"
                  value="22%"
                  text="możliwa sytuacja sporna"
                  info="VAR i kontrowersje zależą od intensywności meczu, liczby sytuacji w polu karnym, fauli i decyzji sędziego."
                />
              </div>

              <SectionTitle title="Forma, tabela i motywacja" />

              <div className="grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team={homeTeam}
                  items={[
                    "Pozycja w tabeli: 2. miejsce",
                    "Cel: walka o mistrzostwo / top 4",
                    "Forma ostatnie 5: W-W-D-W-L",
                    "Gole ostatnie 5: 11 strzelonych, 5 straconych",
                    "Średnia goli: 2.2 na mecz",
                  ]}
                />

                <TeamPanel
                  team={awayTeam}
                  items={[
                    "Pozycja w tabeli: 4. miejsce",
                    "Cel: walka o Ligę Mistrzów",
                    "Forma ostatnie 5: W-D-W-W-W",
                    "Gole ostatnie 5: 9 strzelonych, 4 stracone",
                    "Średnia goli: 1.8 na mecz",
                  ]}
                />
              </div>

              <SectionTitle title="H2H - mecze bezpośrednie" />

              <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5">
                <div className="grid gap-4 md:grid-cols-4">
                  <MiniCard
                    title={`${homeTeam} wygrane`}
                    value="2/5"
                    text="ostatnie H2H"
                    info="H2H pokazuje, jak drużyny radziły sobie w bezpośrednich meczach. To pomocniczy sygnał, nie główna podstawa prognozy."
                  />
                  <MiniCard
                    title={`${awayTeam} wygrane`}
                    value="1/5"
                    text="ostatnie H2H"
                    info="Wygrane gości w H2H pokazują, czy dana drużyna historycznie dobrze radziła sobie z tym rywalem."
                  />
                  <MiniCard
                    title="Remisy"
                    value="2/5"
                    text="ostatnie H2H"
                    info="Remisy w H2H pomagają ocenić, czy rywalizacja często jest wyrównana."
                  />
                  <MiniCard
                    title="BTTS"
                    value="4/5"
                    text="obie strzeliły"
                    info="BTTS w H2H pokazuje, jak często obie drużyny zdobywały bramkę w meczach bezpośrednich."
                  />
                </div>

                <div className="mt-5 grid gap-3 text-sm text-white/70 md:grid-cols-3">
                  <p>Średnia goli H2H: 2.8</p>
                  <p>Over 2.5 w H2H: 3/5</p>
                  <p>Średnia rożnych H2H: 9.6</p>
                  <p>Średnia kartek H2H: 4.2</p>
                  <p>Pierwszy gol gospodarzy: 3/5</p>
                  <p>Gol po 75 minucie: 4/5</p>
                </div>
              </div>

              <SectionTitle title="Przewidywane składy i kluczowi zawodnicy" />

              <div className="grid gap-4 md:grid-cols-2">
                <TeamPanel
                  team={`${homeTeam} - przewidywany skład`}
                  items={[
                    "Bramkarz: podstawowy",
                    "Obrona: ustawienie 4-3-3",
                    "Pomoc: kreatywny środek pola",
                    "Atak: szybkie skrzydła i mocna dziewiątka",
                    "Kluczowy zawodnik: lider ofensywy",
                  ]}
                />

                <TeamPanel
                  team={`${awayTeam} - przewidywany skład`}
                  items={[
                    "Bramkarz: podstawowy",
                    "Obrona: ustawienie 4-2-3-1",
                    "Pomoc: silny pressing",
                    "Atak: kontrataki i wejścia skrzydłami",
                    "Kluczowy zawodnik: główny kreator gry",
                  ]}
                />
              </div>

              <SectionTitle title="Najmocniejsze sygnały AI" />

              <div className="rounded-2xl border border-[#F6C343]/20 bg-[#F6C343]/10 p-5">
                <div className="space-y-3 text-sm leading-6 text-white/75">
                  <p>
                    1. Obie drużyny mają wysoką regularność tworzenia sytuacji
                    bramkowych.
                  </p>
                  <p>2. {homeTeam} generuje dużo rzutów rożnych u siebie.</p>
                  <p>
                    3. {awayTeam} ma potencjał do gola, szczególnie w drugiej
                    połowie.
                  </p>
                  <p>4. H2H sugeruje mecz z golami i dużą liczbą zdarzeń.</p>
                  <p>
                    5. Najbardziej stabilnym scenariuszem jest gol obu drużyn
                    lub over 1.5 gola.
                  </p>
                </div>
              </div>

              <SectionTitle title="Top scenariusze meczu" />

              <div className="grid gap-4 md:grid-cols-3">
                <ScenarioCard
                  title="Scenariusz 1"
                  value="BTTS"
                  chance="62%"
                  text="Obie drużyny strzelą gola."
                  info="Ten scenariusz łączy regularność strzelania obu drużyn, ich defensywę, H2H oraz przewidywaną intensywność meczu."
                />
                <ScenarioCard
                  title="Scenariusz 2"
                  value="Over 1.5 gola"
                  chance="78%"
                  text="Najbezpieczniejszy scenariusz bramkowy."
                  info="Over 1.5 jest zwykle stabilniejszy niż over 2.5. Liczony z ogólnej średniej goli, xG i powtarzalności zdarzenia."
                />
                <ScenarioCard
                  title="Scenariusz 3"
                  value={`${homeTeam} więcej rożnych`}
                  chance="55%"
                  text="Lekka przewaga gospodarzy w stałych fragmentach."
                  info="Ten scenariusz bazuje na średniej rożnych gospodarzy, stylu gry skrzydłami i liczbie ataków pozycyjnych."
                />
              </div>

              <div className="mt-6 rounded-2xl border border-[#F6C343]/20 bg-[#F6C343]/10 p-5">
                <h3 className="font-bold text-[#F6C343]">Wniosek AI</h3>
                <p className="mt-2 leading-7 text-white/75">
                  Model wskazuje mecz o wysokim potencjale zdarzeń: gole, rożne
                  i kartki mają sensowną wartość analityczną. Najmocniejsze
                  kierunki to over 1.5 gola, obie drużyny strzelą gola oraz
                  umiarkowanie wysoka liczba rzutów rożnych. Analiza wskazuje
                  lekką przewagę {homeTeam}, ale ryzyko pozostaje średnie ze
                  względu na jakość {awayTeam} i możliwe zmiany składowe.
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/40">
                AnalityQ tworzy analizę informacyjną. Dane w tej wersji są demo
                i nie pochodzą jeszcze z prawdziwego API sportowego. Raport nie
                gwarantuje wyniku i nie stanowi porady bukmacherskiej ani
                finansowej.
              </p>

              <button
                onClick={handleNewAnalysis}
                className="mt-6 w-full rounded-2xl border border-[#F6C343]/30 bg-[#F6C343]/10 px-6 py-4 font-bold text-[#F6C343] transition duration-300 hover:bg-[#F6C343] hover:text-[#031022]"
              >
                Nowa analiza
              </button>
            </div>
          )}

          {!analysis && !loading && (
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-3">
              <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#F6C343]/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-[#F6C343]/15">
                <p className="text-3xl transition duration-300 group-hover:scale-125">
                  📊
                </p>
                <h3 className="mt-4 font-bold text-[#F6C343]">Statystyki</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Forma, historia spotkań, xG, kontuzje i kluczowe dane przed
                  wydarzeniem.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#F6C343]/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-[#F6C343]/15">
                <p className="text-3xl transition duration-300 group-hover:scale-125">
                  🧠
                </p>
                <h3 className="mt-4 font-bold text-[#F6C343]">Analiza AI</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  AI porządkuje informacje i pokazuje najważniejsze wnioski.
                </p>
              </div>

              <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-[#F6C343]/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-[#F6C343]/15">
                <p className="text-3xl transition duration-300 group-hover:scale-125">
                  ⚡
                </p>
                <h3 className="mt-4 font-bold text-[#F6C343]">Szybkość</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">
                  Jedno pole, jeden klik i gotowa analiza w kilka sekund.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="pointer-events-none absolute right-4 top-4 z-30 opacity-0 transition duration-300 group-hover:opacity-100">
      <div className="w-64 rounded-2xl border border-[#F6C343]/30 bg-[#031022]/95 p-4 text-xs leading-5 text-white/75 shadow-2xl shadow-[#F6C343]/20 backdrop-blur-xl">
        <p className="mb-1 font-bold text-[#F6C343]">Jak to czytać?</p>
        {text}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 className="mt-8 mb-4 text-xl font-black text-[#F6C343]">{title}</h3>;
}

function StatCard({
  title,
  value,
  subtitle,
  info,
}: {
  title: string;
  value: string;
  subtitle: string;
  info?: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#06142F]/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F6C343]/40 hover:shadow-xl hover:shadow-[#F6C343]/10">
      <InfoTooltip
        text={
          info ||
          "Ta wartość pokazuje ogólną ocenę modelu. Docelowo będzie liczona na podstawie formy drużyn, danych sezonowych, ostatnich 5 meczów, H2H i kontekstu spotkania."
        }
      />

      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-[#F6C343]/30 bg-[#F6C343]/10 text-xs font-bold text-[#F6C343]">
        ?
      </div>

      <p className="text-sm text-white/50">{title}</p>
      <p className="mt-1 text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-white/40">{subtitle}</p>
    </div>
  );
}

function ProbabilityCard({
  label,
  value,
  color = "gold",
  info,
}: {
  label: string;
  value: string;
  color?: "gold" | "cyan" | "blue";
  info?: string;
}) {
  const barColor =
    color === "gold"
      ? "bg-[#F6C343]"
      : color === "cyan"
        ? "bg-cyan-300"
        : "bg-blue-300";

  const width = value.replace("%", "");

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#06142F]/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F6C343]/40 hover:shadow-xl hover:shadow-[#F6C343]/10">
      <InfoTooltip
        text={
          info ||
          "Szansa procentowa pokazuje prawdopodobieństwo danego wyniku według modelu. Docelowo będzie liczona z formy sezonowej, ostatnich 5 spotkań, przewagi boiska, H2H i statystyk ofensywno-defensywnych."
        }
      />

      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-[#F6C343]/30 bg-[#F6C343]/10 text-xs font-bold text-[#F6C343]">
        ?
      </div>

      <p className="text-sm text-white/50">{label}</p>
      <p className="mt-1 text-3xl font-black text-white">{value}</p>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function MiniCard({
  title,
  value,
  text,
  info,
}: {
  title: string;
  value: string;
  text: string;
  info?: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-[#06142F]/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F6C343]/40 hover:shadow-xl hover:shadow-[#F6C343]/10">
      <InfoTooltip
        text={
          info ||
          "Kafelek pokazuje prognozę dla konkretnego zdarzenia. W finalnej wersji wynik będzie liczony z danych historycznych, średnich sezonowych, ostatnich 5 meczów, H2H i kontekstu meczu."
        }
      />

      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-[#F6C343]/30 bg-[#F6C343]/10 text-xs font-bold text-[#F6C343]">
        ?
      </div>

      <p className="text-sm text-white/50">{title}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-white/45">{text}</p>
    </div>
  );
}

function TeamPanel({ team, items }: { team: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F6C343]/40 hover:shadow-xl hover:shadow-[#F6C343]/10">
      <h3 className="font-bold text-[#F6C343]">{team}</h3>
      <div className="mt-4 space-y-3 text-sm leading-6 text-white/70">
        {items.map((item) => (
          <p key={item}>✓ {item}</p>
        ))}
      </div>
    </div>
  );
}

function ScenarioCard({
  title,
  value,
  chance,
  text,
  info,
}: {
  title: string;
  value: string;
  chance: string;
  text: string;
  info?: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-[#F6C343]/20 bg-[#F6C343]/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#F6C343]/50 hover:shadow-xl hover:shadow-[#F6C343]/15">
      <InfoTooltip
        text={
          info ||
          "Scenariusz AI łączy kilka danych: formę drużyn, trend bramkowy, H2H, przewagę boiska i powtarzalność danego zdarzenia w poprzednich meczach."
        }
      />

      <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full border border-[#F6C343]/30 bg-[#F6C343]/10 text-xs font-bold text-[#F6C343]">
        ?
      </div>

      <p className="text-xs font-semibold uppercase tracking-widest text-white/45">
        {title}
      </p>
      <h3 className="mt-2 text-xl font-black text-[#F6C343]">{value}</h3>
      <p className="mt-1 text-3xl font-black text-white">{chance}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">{text}</p>
    </div>
  );
}