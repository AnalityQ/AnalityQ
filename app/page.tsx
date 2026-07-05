"use client";

import { useState } from "react";

export default function Home() {
  const [match, setMatch] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(false);

  function handleAnalyze() {
    if (!match.trim()) return;

    setAnalysis(false);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setAnalysis(true);
    }, 1800);
  }
  function handleNewAnalysis() {
    setMatch("");
    setAnalysis(false);
    setLoading(false);
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
              <p className="font-bold text-[#F6C343]">AI analizuje wydarzenie...</p>
              <p className="mt-2 text-sm text-white/60">
                Sprawdzam formę, statystyki i możliwe scenariusze.
              </p>
            </div>
          )}

{analysis && !loading && (
  <div className="relative z-20 mx-auto mt-8 max-w-4xl rounded-3xl border border-[#F6C343]/30 bg-white/10 p-6 text-left shadow-2xl shadow-[#F6C343]/15 backdrop-blur-xl">
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-[#F6C343]">
          Raport AnalityQ
        </p>
        <h2 className="mt-1 text-2xl font-black text-white md:text-3xl">
          {match}
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Analiza demo oparta na przykładowym modelu oceny wydarzenia.
        </p>
      </div>

      <div className="rounded-3xl border border-[#F6C343]/30 bg-[#F6C343]/10 px-6 py-4 text-center shadow-lg shadow-[#F6C343]/20">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          AI Score
        </p>
        <p className="mt-1 text-4xl font-black text-[#F6C343]">84%</p>
      </div>
    </div>

    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/60">Pewność modelu</span>
        <span className="font-bold text-[#F6C343]">84 / 100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-[84%] rounded-full bg-[#F6C343] shadow-[0_0_18px_rgba(246,195,67,0.65)]" />
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5">
        <p className="text-sm text-white/50">Gospodarze</p>
        <p className="mt-1 text-3xl font-black text-white">52%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[52%] rounded-full bg-[#F6C343]" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5">
        <p className="text-sm text-white/50">Remis</p>
        <p className="mt-1 text-3xl font-black text-white">26%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[26%] rounded-full bg-cyan-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5">
        <p className="text-sm text-white/50">Goście</p>
        <p className="mt-1 text-3xl font-black text-white">22%</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[22%] rounded-full bg-blue-300" />
        </div>
      </div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5">
        <h3 className="font-bold text-[#F6C343]">Kluczowe czynniki</h3>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>✓ Forma drużyn z ostatnich spotkań</p>
          <p>✓ Przewaga własnego boiska</p>
          <p>✓ Potencjał ofensywny i defensywny</p>
          <p>✓ Historia bezpośrednich spotkań</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#06142F]/75 p-5">
        <h3 className="font-bold text-[#F6C343]">Ryzyko analizy</h3>
        <div className="mt-4 space-y-3 text-sm text-white/70">
          <p>⚠️ Możliwe rotacje w składzie</p>
          <p>⚠️ Brak pełnych danych live w wersji demo</p>
          <p>⚠️ Sport ma wysoką losowość</p>
          <p>⚠️ To nie jest gwarancja wyniku</p>
        </div>
      </div>
    </div>

    <div className="mt-6 rounded-2xl border border-[#F6C343]/20 bg-[#F6C343]/10 p-5">
      <h3 className="font-bold text-[#F6C343]">Wniosek AI</h3>
      <p className="mt-2 leading-7 text-white/75">
        Model wskazuje lekką przewagę gospodarzy, głównie przez profil
        spotkania, przewagę własnego boiska i stabilniejszą formę. Najbardziej
        prawdopodobny scenariusz to wyrównany mecz z niewielką przewagą jednej
        strony.
      </p>
    </div>

    <p className="mt-4 text-xs leading-5 text-white/40">
      AnalityQ tworzy analizę informacyjną. Nie gwarantuje wyniku i nie stanowi
      porady bukmacherskiej ani finansowej.
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