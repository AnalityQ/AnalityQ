export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-gradient-to-br from-[#071A3D] via-[#0E3A8A] to-[#020817] text-white">
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#071A3D]/70 backdrop-blur-xl">
  <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
    <div className="text-xl font-black">
      Anality<span className="text-[#F6C343]">Q</span>
    </div>

    <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
      <a className="hover:text-[#F6C343]" href="#">Funkcje</a>
      <a className="hover:text-[#F6C343]" href="#">Cennik</a>
      <a className="hover:text-[#F6C343]" href="#">O nas</a>
    </nav>

    <button className="rounded-full bg-[#F6C343] px-5 py-2 text-sm font-bold text-[#071A3D] hover:bg-[#ffd76a]">
      Rozpocznij
    </button>
  </div>
</header>
      <section className="relative flex min-h-screen items-center justify-center px-6">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-[#F6C343]/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 w-full max-w-5xl text-center">
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-[#F6C343]/40 bg-[#F6C343]/10 px-5 py-2 text-sm font-semibold text-[#F6C343] shadow-lg shadow-[#F6C343]/20 backdrop-blur">
  <span className="h-2 w-2 rounded-full bg-[#F6C343] shadow-[0_0_12px_#F6C343]" />
  AI Sports Intelligence Platform
</div>
<h1 className="mb-6 text-4xl md:text-6xl font-extrabold text-white leading-tight">
  Inteligentna analiza
  <span className="text-[#F6C343]"> meczów sportowych</span>
</h1>
<img
  src="/logo.png"
  alt="Logo AnalityQ"
  className="mx-auto mb-12 w-96 drop-shadow-[0_0_45px_rgba(246,195,67,0.55)] transition duration-300 hover:scale-105"
/>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70 md:text-xl">
            Podejmuj lepsze decyzje dzięki analizie AI.
Sprawdź formę drużyn, statystyki, kursy i przewidywania w kilka sekund.
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur md:flex-row">
            <input
              className="flex-1 rounded-2xl border border-white/10 bg-[#06142F] px-5 py-4 text-white outline-none placeholder:text-white/40"
              placeholder="Wpisz mecz... np. Liverpool vs Arsenal"
            />

            <button className="rounded-2xl bg-[#F6C343] px-8 py-4 font-bold text-[#071A3D] transition hover:scale-105 hover:bg-[#ffd76a]">
              Analizuj
            </button>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
              <p className="text-3xl">📊</p>
              <h3 className="mt-4 font-bold text-[#F6C343]">Statystyki</h3>
              <p className="mt-2 text-sm text-white/60">
                Forma, historia spotkań i kluczowe dane przed wydarzeniem.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
              <p className="text-3xl">🧠</p>
              <h3 className="mt-4 font-bold text-[#F6C343]">Analiza AI</h3>
              <p className="mt-2 text-sm text-white/60">
                AI porządkuje informacje i pokazuje najważniejsze wnioski.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
              <p className="text-3xl">⚡</p>
              <h3 className="mt-4 font-bold text-[#F6C343]">Szybkość</h3>
              <p className="mt-2 text-sm text-white/60">
                Jedno pole, jeden klik i gotowa analiza w kilka sekund.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}