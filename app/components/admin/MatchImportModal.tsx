"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { selectImportMatches } from "@/lib/football-api/apply-import";
import {
  filterFixtureSummaries,
  sortFixtureSummaries,
} from "@/lib/football-api/fixture-list";
import { studioSessionExpiredEvent } from "@/lib/studio-auth";
import type {
  AggregatedLastMatches,
  FootballFixtureSummary,
  FootballMatchImport,
  NormalizedTeamMatchStats,
} from "@/lib/football-api/types";
import { Logo } from "../Logo";
import { LeagueLogo, TeamLogo } from "../ApiImage";

const fixturesPageSize = 24;
const requestTimeoutMs = 25_000;
const importTimeoutMs = 75_000;
const subscribeClientReady = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const importSteps = [
  "Łączenie ze źródłem danych…",
  "Pobieranie danych meczu…",
  "Analiza gospodarzy…",
  "Analiza gości…",
  "Pobieranie historii i statystyk spotkań…",
  "Pobieranie tabeli, H2H, składów i absencji…",
  "Normalizacja danych i budowa sygnałów…",
  "Dane gotowe do sprawdzenia.",
];

function today() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function value(number: number | null, digits = 1) {
  return number === null ? "—" : number.toFixed(digits);
}

function cards(match: NormalizedTeamMatchStats, side: "for" | "against") {
  const values = side === "for"
    ? [match.yellowCardsFor, match.redCardsFor]
    : [match.yellowCardsAgainst, match.redCardsAgainst];
  const available = values.filter((item): item is number => item !== null);
  return available.length ? String(available.reduce((sum, item) => sum + item, 0)) : "—";
}

async function readResponse<T>(response: Response): Promise<T> {
  let payload: { data?: T; error?: { message?: string } } = {};
  try {
    payload = await response.json() as typeof payload;
  } catch {
    // Odpowiedź pośrednika lub platformy może nie być JSON-em.
  }
  if (response.status === 401) {
    window.dispatchEvent(new Event(studioSessionExpiredEvent));
    throw new Error("Sesja wygasła. Zaloguj się ponownie.");
  }
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "Nie udało się pobrać danych piłkarskich.");
  }
  return payload.data;
}

function FixtureCard({ fixture, onSelect }: { fixture: FootballFixtureSummary; onSelect: () => void }) {
  return (
    <article className="api-fixture-card">
      <div className="flex items-center gap-3">
        <LeagueLogo src={fixture.leagueLogo} alt={fixture.leagueName} size={34} />
        <div className="min-w-0"><p className="truncate text-sm font-black text-white">{fixture.leagueName}</p><p className="truncate text-xs text-slate-400">{fixture.leagueCountry}</p></div>
        <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[.65rem] font-black text-slate-300">{fixture.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        <strong className="row-span-2 text-lg text-cyan-100">{formatTime(fixture.kickoff)}</strong>
        <div className="flex min-w-0 items-center gap-2"><TeamLogo src={fixture.homeTeam.logo} alt={fixture.homeTeam.name} size={34} /><span className="truncate font-bold text-white" title={fixture.homeTeam.name}>{fixture.homeTeam.name}</span></div>
        <div className="flex min-w-0 items-center gap-2"><TeamLogo src={fixture.awayTeam.logo} alt={fixture.awayTeam.name} size={34} /><span className="truncate font-bold text-white" title={fixture.awayTeam.name}>{fixture.awayTeam.name}</span></div>
      </div>
      {fixture.venue && <p className="mt-3 text-xs text-slate-500">{fixture.venue}</p>}
      <button type="button" className="btn-primary mt-4 w-full justify-center" onClick={onSelect}>Wybierz mecz</button>
    </article>
  );
}

function MatchRow({
  match,
  checked,
  onToggle,
}: {
  match: NormalizedTeamMatchStats;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
      <tr className="api-match-table-row">
        <td><input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Uwzględnij mecz z ${match.opponentName}`} /></td>
        <td>{formatDate(match.date)}</td><td>{match.opponentName}</td><td>{match.isHome ? "Dom" : "Wyjazd"}</td>
        <td><span className={`form-pill form-${match.result.toLowerCase()}`}>{match.result}</span></td>
        <td>{value(match.goalsFor, 0)}:{value(match.goalsAgainst, 0)}</td><td>{value(match.shotsFor, 0)}</td>
        <td>{value(match.cornersFor, 0)}</td><td>{cards(match, "for")}</td><td>{value(match.xgFor, 2)}</td>
      </tr>
  );
}

function MobileMatchCard({ match, checked, onToggle }: { match: NormalizedTeamMatchStats; checked: boolean; onToggle: () => void }) {
  return <article className="api-match-mobile-card"><label className="flex items-center gap-3"><input type="checkbox" checked={checked} onChange={onToggle} /><strong className="text-white">Uwzględnij w analizie</strong></label><div className="mt-3 flex items-center justify-between gap-3"><div><p className="font-black text-white">{match.opponentName}</p><p className="text-xs text-slate-400">{formatDate(match.date)} · {match.isHome ? "Dom" : "Wyjazd"}</p></div><span className={`form-pill form-${match.result.toLowerCase()}`}>{match.result}</span></div><div className="mt-3 grid grid-cols-5 gap-2 text-center text-xs"><span>Gole<br/><b>{value(match.goalsFor, 0)}:{value(match.goalsAgainst, 0)}</b></span><span>Strzały<br/><b>{value(match.shotsFor, 0)}</b></span><span>Rożne<br/><b>{value(match.cornersFor, 0)}</b></span><span>Kartki<br/><b>{cards(match, "for")}</b></span><span>xG<br/><b>{value(match.xgFor, 2)}</b></span></div></article>;
}

function TeamMatches({
  title,
  matches,
  selected,
  onToggle,
}: {
  title: string;
  matches: NormalizedTeamMatchStats[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  return (
    <section className="api-review-section">
      <h3 className="text-xl font-black text-white">{title}</h3>
      {!matches.length ? <p className="mt-4 text-sm text-amber-100">Brak zakończonych spotkań do uwzględnienia.</p> : (
        <div className="mt-4 overflow-x-auto">
          <table className="api-match-table"><thead><tr><th></th><th>Data</th><th>Przeciwnik</th><th>Miejsce</th><th>Forma</th><th>Gole</th><th>Strzały</th><th>Rożne</th><th>Kartki</th><th>xG</th></tr></thead>
            <tbody>{matches.map((match) => <MatchRow key={match.fixtureId} match={match} checked={selected.includes(match.fixtureId)} onToggle={() => onToggle(match.fixtureId)} />)}</tbody>
          </table>
          <div className="api-mobile-matches">{matches.map((match) => <MobileMatchCard key={match.fixtureId} match={match} checked={selected.includes(match.fixtureId)} onToggle={() => onToggle(match.fixtureId)} />)}</div>
        </div>
      )}
    </section>
  );
}

function AggregateSummary({ title, aggregate }: { title: string; aggregate: AggregatedLastMatches }) {
  const entries: Array<[string, number | null, keyof AggregatedLastMatches["coverage"]]> = [
    ["Gole strzelone", aggregate.goalsForLast5, "goals"], ["Gole stracone", aggregate.goalsAgainstLast5, "goals"],
    ["Strzały", aggregate.shotsForLast5, "shots"], ["Strzały celne", aggregate.shotsOnTargetForLast5, "shotsOnTarget"],
    ["Rzuty rożne", aggregate.cornersForLast5, "corners"], ["Kartki", aggregate.cardsForLast5, "cards"],
    ["xG", aggregate.xgForLast5, "xg"],
  ];
  return <div className="api-aggregate-card"><p className="font-black text-white">{title}</p><p className="mt-1 text-xs text-slate-400">{aggregate.matchesCount} uwzględnionych spotkań · forma {aggregate.formLast5 || "—"}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{entries.map(([label, total, key]) => <div key={label}><span>{label}</span><strong>{value(total, 2)}</strong><small>z {aggregate.coverage[key]} meczów</small></div>)}</div></div>;
}

function CoverageSummary({ title, aggregate }: { title: string; aggregate: AggregatedLastMatches }) {
  const labels: Array<[keyof AggregatedLastMatches["coverage"], string]> = [
    ["goals", "Gole"], ["shots", "Strzały"], ["shotsOnTarget", "Strzały celne"],
    ["corners", "Rzuty rożne"], ["cards", "Kartki"], ["xg", "xG"],
  ];
  const possible = aggregate.matchesCount * labels.length;
  const available = labels.reduce((sum, [key]) => sum + aggregate.coverage[key], 0);
  const completeness = possible > 0 ? Math.round((available / possible) * 100) : 0;
  return (
    <div className="api-coverage-card">
      <div className="flex items-center justify-between gap-3"><strong>{title}</strong><span>{completeness}% kompletności</span></div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {labels.map(([key, label]) => <div key={key}><span>{label}</span><strong>{aggregate.coverage[key]}/{aggregate.matchesCount}</strong></div>)}
      </div>
    </div>
  );
}

export function MatchImportModal({ onClose, onApply }: { onClose: () => void; onApply: (data: FootballMatchImport) => void }) {
  const portalReady = useSyncExternalStore(
    subscribeClientReady,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [date, setDate] = useState(today);
  const [query, setQuery] = useState("");
  const [fixtures, setFixtures] = useState<FootballFixtureSummary[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesRequested, setFixturesRequested] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(fixturesPageSize);
  const [error, setError] = useState("");
  const [imported, setImported] = useState<FootballMatchImport | null>(null);
  const [importStep, setImportStep] = useState(-1);
  const [homeSelected, setHomeSelected] = useState<number[]>([]);
  const [awaySelected, setAwaySelected] = useState<number[]>([]);
  const [refreshPrompt, setRefreshPrompt] = useState(false);
  const fixturesRequestRef = useRef<AbortController | null>(null);
  const importRequestRef = useRef<AbortController | null>(null);
  const initialFixturesRequestRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const cancelRequests = useCallback(() => {
    const fixturesRequest = fixturesRequestRef.current;
    const importRequest = importRequestRef.current;
    fixturesRequestRef.current = null;
    importRequestRef.current = null;
    fixturesRequest?.abort();
    importRequest?.abort();
    setFixturesLoading(false);
  }, []);

  const closeModal = useCallback(() => {
    cancelRequests();
    onCloseRef.current();
  }, [cancelRequests]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      cancelRequests();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [cancelRequests, closeModal]);

  const filteredFixtures = useMemo(
    () => filterFixtureSummaries(fixtures, deferredQuery),
    [deferredQuery, fixtures],
  );
  const visibleFixtures = useMemo(
    () => filteredFixtures.slice(0, visibleLimit),
    [filteredFixtures, visibleLimit],
  );
  const remainingFixtures = Math.max(0, filteredFixtures.length - visibleFixtures.length);

  const selectedImport = useMemo(() => imported ? selectImportMatches(imported, homeSelected, awaySelected) : null, [awaySelected, homeSelected, imported]);

  const loadFixtures = useCallback(async (refresh = false) => {
    fixturesRequestRef.current?.abort();
    const controller = new AbortController();
    fixturesRequestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    setFixturesLoading(true);
    setFixturesRequested(true);
    setVisibleLimit(fixturesPageSize);
    setError("");
    try {
      const response = await fetch(
        `/api/football/fixtures?date=${encodeURIComponent(date)}${refresh ? "&refresh=true" : ""}`,
        { cache: "no-store", signal: controller.signal },
      );
      const data = await readResponse<FootballFixtureSummary[]>(response);
      setFixtures(sortFixtureSummaries(data));
    } catch (loadError) {
      if (controller.signal.aborted && fixturesRequestRef.current !== controller) return;
      setFixtures([]);
      setError(
        loadError instanceof Error && loadError.name === "AbortError"
          ? "Pobieranie meczów trwało zbyt długo. Sprawdź połączenie i spróbuj ponownie."
          : loadError instanceof Error
            ? loadError.message
            : "Nie udało się pobrać listy meczów.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (fixturesRequestRef.current === controller) {
        fixturesRequestRef.current = null;
        setFixturesLoading(false);
      }
    }
  }, [date]);

  useEffect(() => {
    if (!portalReady || initialFixturesRequestRef.current) return;
    initialFixturesRequestRef.current = true;
    void loadFixtures();
  }, [loadFixtures, portalReady]);

  async function loadImport(fixtureId: number, refresh = false) {
    importRequestRef.current?.abort();
    const controller = new AbortController();
    importRequestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), importTimeoutMs);
    setError(""); setImportStep(0); setRefreshPrompt(false);
    const interval = window.setInterval(() => setImportStep((step) => Math.min(step + 1, importSteps.length - 2)), 1300);
    try {
      const response = await fetch("/api/football/match-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtureId, refresh }),
        signal: controller.signal,
      });
      const data = await readResponse<FootballMatchImport>(response);
      setImported(data); setHomeSelected(data.home.matches.map((match) => match.fixtureId)); setAwaySelected(data.away.matches.map((match) => match.fixtureId)); setImportStep(importSteps.length - 1);
    } catch (loadError) {
      if (controller.signal.aborted && importRequestRef.current !== controller) return;
      setError(
        loadError instanceof Error && loadError.name === "AbortError"
          ? "Pobieranie danych meczu zostało anulowane albo przekroczyło limit czasu. Możesz spróbować ponownie."
          : loadError instanceof Error
            ? loadError.message
            : "Nie udało się pobrać danych meczu.",
      );
      setImportStep(-1);
    } finally {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      if (importRequestRef.current === controller) importRequestRef.current = null;
    }
  }

  function cancelImport() {
    const activeRequest = importRequestRef.current;
    importRequestRef.current = null;
    activeRequest?.abort();
    setImportStep(-1);
    setError("Pobieranie danych meczu zostało anulowane. Możesz wybrać mecz ponownie.");
  }

  function toggle(list: number[], setList: (value: number[]) => void, id: number) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  if (!portalReady) return null;

  return createPortal(
    <div
      className="match-import-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Pobierz dane meczu"
      aria-busy={fixturesLoading || (importStep >= 0 && importStep < importSteps.length - 1)}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div className="match-import-modal" onMouseDown={(event) => event.stopPropagation()}>
        <header className="match-import-header"><Logo href="" /><div><p className="eyebrow">Import danych</p><h2 className="text-xl font-black text-white">{imported ? "Sprawdź pobrane dane" : "Pobierz dane meczu"}</h2></div><button type="button" onClick={closeModal}>Zamknij</button></header>
        <div className="match-import-scroll">
          {importStep >= 0 && importStep < importSteps.length - 1 ? (
            <div className="api-progress-panel" aria-live="polite"><div className="api-radar" aria-hidden="true"><span /></div><div className="mt-5 grid gap-3">{importSteps.map((step, index) => <div key={step} className={`api-progress-step ${index <= importStep ? "active" : ""}`}><span>{index < importStep ? "OK" : index + 1}</span><p>{step}</p></div>)}</div><p className="mt-5 text-xs leading-6 text-slate-500">Etapy pokazują aktualną fazę importu. Czas zależy od dostępności danych dostawcy.</p><button type="button" className="btn-secondary mt-5" onClick={cancelImport}>Anuluj pobieranie</button></div>
          ) : imported && selectedImport ? (
            <div className="space-y-5">
              <section className="api-review-section"><p className="eyebrow">Dane meczu</p><div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex flex-wrap items-center gap-3"><TeamLogo src={imported.fixture.homeTeam.logo} alt={imported.fixture.homeTeam.name} size={48} /><h3 className="text-2xl font-black text-white">{imported.fixture.homeTeam.name} vs {imported.fixture.awayTeam.name}</h3><TeamLogo src={imported.fixture.awayTeam.logo} alt={imported.fixture.awayTeam.name} size={48} /></div><p className="mt-2 text-sm text-slate-400">{imported.fixture.leagueName} · {formatDate(imported.fixture.kickoff)} {formatTime(imported.fixture.kickoff)} · {imported.fixture.venue || "stadion nie został podany przez API-Football"}</p></div><button type="button" className="btn-secondary" onClick={() => setRefreshPrompt(true)}>Odśwież dane</button></div></section>
              {refreshPrompt && <div className="api-warning"><strong>Odświeżenie pominie cache i zużyje kolejne zapytania API.</strong><div className="mt-3 flex gap-2"><button type="button" className="btn-primary" onClick={() => void loadImport(imported.fixture.id, true)}>Odśwież mimo to</button><button type="button" className="btn-secondary" onClick={() => setRefreshPrompt(false)}>Anuluj</button></div></div>}
              <TeamMatches title={`Ostatnie mecze gospodarzy — ${imported.home.team.name}`} matches={imported.home.matches} selected={homeSelected} onToggle={(id) => toggle(homeSelected, setHomeSelected, id)} />
              <TeamMatches title={`Ostatnie mecze gości — ${imported.away.team.name}`} matches={imported.away.matches} selected={awaySelected} onToggle={(id) => toggle(awaySelected, setAwaySelected, id)} />
              <section className="api-review-section"><h3 className="text-xl font-black text-white">Podsumowanie statystyk</h3><div className="mt-4 grid gap-4 lg:grid-cols-2"><AggregateSummary title={imported.home.team.name} aggregate={selectedImport.home.aggregate} /><AggregateSummary title={imported.away.team.name} aggregate={selectedImport.away.aggregate} /></div></section>
              <section className="api-review-section"><h3 className="text-xl font-black text-white">Kompletność danych i pokrycie statystyk</h3><p className="mt-2 text-sm leading-6 text-slate-400">Wartość 0/5 oznacza brak danych, nie wynik równy zero. Po odznaczeniu spotkania podsumowanie przelicza się automatycznie.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><CoverageSummary title={`Gospodarze · ${imported.home.team.name}`} aggregate={selectedImport.home.aggregate} /><CoverageSummary title={`Goście · ${imported.away.team.name}`} aggregate={selectedImport.away.aggregate} /></div></section>
              <section className="api-review-section"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-xl font-black text-white">Zakres pełnego importu</h3><p className="mt-2 text-sm text-slate-400">{imported.snapshot.requestSummary.totalRequests} logicznych wywołań providera · maksymalnie {imported.snapshot.requestSummary.concurrencyLimit} równolegle</p></div><span className="source-mode-badge source-api">Snapshot v{imported.snapshot.version}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(imported.snapshot.coverage).map(([name, coverage]) => <div key={name} className={`coverage-card coverage-${coverage.status}`}><span>{coverage.status}</span><strong>{name}</strong><small>{coverage.samples} rekordów / próbek</small><p>{coverage.message}</p></div>)}</div><details className="advanced-adjustments mt-4"><summary>Endpointy i cache</summary><p>{imported.snapshot.requestSummary.cacheStrategy}</p><div className="mt-3 space-y-2">{imported.snapshot.requestSummary.endpoints.map((item) => <div key={item.endpoint} className="data-source-item"><span>{item.endpoint} · {item.status} · {item.requests} wywołań</span><strong>{item.message}</strong></div>)}</div></details></section>
              {selectedImport.warnings.length > 0 && <section className="api-warning"><h3 className="font-black">Ostrzeżenia o brakach danych</h3><ul className="mt-3 list-disc space-y-2 pl-5">{selectedImport.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></section>}
              <div className="api-odds-reminder">Uzupełnij aktualne kursy, aby obliczyć prawdopodobieństwo wynikające z kursu, edge i Value Index.</div>
            </div>
          ) : (
            <div>
              <div className="api-picker-controls"><label><span>Data meczów</span><input className="admin-input" type="date" value={date} onChange={(event) => { const activeRequest = fixturesRequestRef.current; fixturesRequestRef.current = null; activeRequest?.abort(); setFixturesLoading(false); setDate(event.target.value); setFixturesRequested(false); setFixtures([]); setVisibleLimit(fixturesPageSize); setError(""); }} /></label><button type="button" className="btn-primary" disabled={fixturesLoading} onClick={() => void loadFixtures()}>{fixturesLoading ? "Ładowanie meczów…" : "Pokaż mecze"}</button><label><span>Wyszukaj drużynę lub ligę</span><input className="admin-input" type="search" placeholder="np. Polska lub Liga Mistrzów" value={query} onChange={(event) => { setQuery(event.target.value); setVisibleLimit(fixturesPageSize); }} /></label></div>
              {fixturesLoading && <div className="api-fixture-loading" aria-live="polite"><div className="studio-message">Pobieranie aktualnej listy meczów…</div><div className="api-fixture-skeleton-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div></div>}
              {!fixturesLoading && fixtures.length === 0 && !error && <div className="studio-message">{fixturesRequested ? "Nie znaleziono meczów dla wybranej daty." : "Wybierz datę i kliknij „Pokaż mecze”."}</div>}
              {!fixturesLoading && fixtures.length > 0 && filteredFixtures.length === 0 && <div className="studio-message">Nie znaleziono meczów pasujących do wyszukiwania.</div>}
              {!fixturesLoading && filteredFixtures.length > 0 && <div className="api-fixture-results" aria-live="polite"><span>Znaleziono {filteredFixtures.length} spotkań</span><strong>Pokazujemy {visibleFixtures.length}</strong></div>}
              {!fixturesLoading && <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleFixtures.map((fixture) => <FixtureCard key={fixture.id} fixture={fixture} onSelect={() => void loadImport(fixture.id)} />)}</div>}
              {!fixturesLoading && remainingFixtures > 0 && <button type="button" className="btn-secondary api-fixture-more" onClick={() => setVisibleLimit((limit) => limit + fixturesPageSize)}>Pokaż kolejne ({Math.min(fixturesPageSize, remainingFixtures)})</button>}
            </div>
          )}
          {error && <div className="studio-error api-fixture-error" role="alert"><span>{error}</span>{!imported && <button type="button" className="btn-secondary" disabled={fixturesLoading} onClick={() => void loadFixtures()}>Spróbuj ponownie</button>}</div>}
        </div>
        <footer className="match-import-footer"><button type="button" className="btn-secondary" onClick={closeModal}>Anuluj</button>{selectedImport && <button type="button" className="btn-primary" onClick={() => onApply(selectedImport)}>Uzupełnij formularz</button>}</footer>
      </div>
    </div>,
    document.body,
  );
}
