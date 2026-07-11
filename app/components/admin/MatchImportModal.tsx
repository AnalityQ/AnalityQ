"use client";

import { useMemo, useState } from "react";
import { selectImportMatches } from "@/lib/football-api/apply-import";
import type {
  AggregatedLastMatches,
  FootballFixtureSummary,
  FootballMatchImport,
  NormalizedTeamMatchStats,
} from "@/lib/football-api/types";
import { Logo } from "../Logo";

const importSteps = [
  "Pobieranie danych meczu…",
  "Pobieranie ostatnich spotkań gospodarzy…",
  "Pobieranie ostatnich spotkań gości…",
  "Pobieranie statystyk meczowych…",
  "Przeliczanie danych…",
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
  const payload = (await response.json()) as { data?: T; error?: { message?: string } };
  if (!response.ok || !payload.data) {
    throw new Error(payload.error?.message || "Nie udało się pobrać danych piłkarskich.");
  }
  return payload.data;
}

function ApiLogo({ url, label }: { url?: string | null; label: string }) {
  if (!url) return <span className="api-logo api-logo-fallback" aria-hidden="true">{label.slice(0, 1)}</span>;
  return <span className="api-logo" role="img" aria-label={label} style={{ backgroundImage: `url(${url})` }} />;
}

function FixtureCard({ fixture, onSelect }: { fixture: FootballFixtureSummary; onSelect: () => void }) {
  return (
    <article className="api-fixture-card">
      <div className="flex items-center gap-3">
        <ApiLogo url={fixture.leagueLogo} label={fixture.leagueName} />
        <div className="min-w-0"><p className="truncate text-sm font-black text-white">{fixture.leagueName}</p><p className="truncate text-xs text-slate-400">{fixture.leagueCountry}</p></div>
        <span className="ml-auto rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[.65rem] font-black text-slate-300">{fixture.status}</span>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2">
        <strong className="row-span-2 text-lg text-cyan-100">{formatTime(fixture.kickoff)}</strong>
        <div className="flex items-center gap-2"><ApiLogo url={fixture.homeTeam.logo} label={fixture.homeTeam.name} /><span className="font-bold text-white">{fixture.homeTeam.name}</span></div>
        <div className="flex items-center gap-2"><ApiLogo url={fixture.awayTeam.logo} label={fixture.awayTeam.name} /><span className="font-bold text-white">{fixture.awayTeam.name}</span></div>
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
    ["Gole strzelone", aggregate.goalsForLast5, "goalsForLast5"], ["Gole stracone", aggregate.goalsAgainstLast5, "goalsAgainstLast5"],
    ["Strzały", aggregate.shotsForLast5, "shotsForLast5"], ["Rzuty rożne", aggregate.cornersForLast5, "cornersForLast5"],
    ["Kartki", aggregate.cardsForLast5, "cardsForLast5"], ["xG", aggregate.xgForLast5, "xgForLast5"],
  ];
  return <div className="api-aggregate-card"><p className="font-black text-white">{title}</p><p className="mt-1 text-xs text-slate-400">{aggregate.matchesCount} uwzględnionych spotkań · forma {aggregate.formLast5 || "—"}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{entries.map(([label, total, key]) => <div key={label}><span>{label}</span><strong>{value(total, 2)}</strong><small>z {aggregate.coverage[key]} meczów</small></div>)}</div></div>;
}

export function MatchImportModal({ onClose, onApply }: { onClose: () => void; onApply: (data: FootballMatchImport) => void }) {
  const [date, setDate] = useState(today);
  const [query, setQuery] = useState("");
  const [fixtures, setFixtures] = useState<FootballFixtureSummary[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [fixturesRequested, setFixturesRequested] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState<FootballMatchImport | null>(null);
  const [importStep, setImportStep] = useState(-1);
  const [homeSelected, setHomeSelected] = useState<number[]>([]);
  const [awaySelected, setAwaySelected] = useState<number[]>([]);
  const [refreshPrompt, setRefreshPrompt] = useState(false);

  const visibleFixtures = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return fixtures.filter((fixture) => !normalized || `${fixture.leagueName} ${fixture.homeTeam.name} ${fixture.awayTeam.name}`.toLowerCase().includes(normalized));
  }, [fixtures, query]);

  const selectedImport = useMemo(() => imported ? selectImportMatches(imported, homeSelected, awaySelected) : null, [awaySelected, homeSelected, imported]);

  async function loadFixtures(refresh = false) {
    setFixturesLoading(true); setFixturesRequested(true); setError("");
    try {
      const response = await fetch(`/api/football/fixtures?date=${encodeURIComponent(date)}${refresh ? "&refresh=true" : ""}`);
      setFixtures(await readResponse<FootballFixtureSummary[]>(response));
    } catch (loadError) {
      setFixtures([]); setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać listy meczów.");
    } finally { setFixturesLoading(false); }
  }

  async function loadImport(fixtureId: number, refresh = false) {
    setError(""); setImportStep(0); setRefreshPrompt(false);
    const interval = window.setInterval(() => setImportStep((step) => Math.min(step + 1, 4)), 1300);
    try {
      const response = await fetch("/api/football/match-import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fixtureId, refresh }) });
      const data = await readResponse<FootballMatchImport>(response);
      setImported(data); setHomeSelected(data.home.matches.map((match) => match.fixtureId)); setAwaySelected(data.away.matches.map((match) => match.fixtureId)); setImportStep(5);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać danych meczu."); setImportStep(-1);
    } finally { window.clearInterval(interval); }
  }

  function toggle(list: number[], setList: (value: number[]) => void, id: number) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  return (
    <div className="match-import-backdrop" role="dialog" aria-modal="true" aria-label="Pobierz dane meczu">
      <div className="match-import-modal">
        <header className="match-import-header"><Logo href="" /><div><p className="eyebrow">Import z API-Football</p><h2 className="text-xl font-black text-white">{imported ? "Sprawdź pobrane dane" : "Pobierz dane meczu"}</h2></div><button type="button" onClick={onClose} aria-label="Zamknij import">×</button></header>
        <div className="match-import-scroll">
          {importStep >= 0 && importStep < 5 ? (
            <div className="api-progress-panel"><div className="api-progress-bar"><span style={{ width: `${((importStep + 1) / importSteps.length) * 100}%` }} /></div><div className="mt-5 grid gap-3">{importSteps.map((step, index) => <div key={step} className={`api-progress-step ${index <= importStep ? "active" : ""}`}><span>{index < importStep ? "✓" : index + 1}</span><p>{step}</p></div>)}</div></div>
          ) : imported && selectedImport ? (
            <div className="space-y-5">
              <section className="api-review-section"><p className="eyebrow">Dane meczu</p><div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><h3 className="text-2xl font-black text-white">{imported.fixture.homeTeam.name} vs {imported.fixture.awayTeam.name}</h3><p className="mt-2 text-sm text-slate-400">{imported.fixture.leagueName} · {formatDate(imported.fixture.kickoff)} {formatTime(imported.fixture.kickoff)} · {imported.fixture.venue || "brak stadionu"}</p></div><button type="button" className="btn-secondary" onClick={() => setRefreshPrompt(true)}>Odśwież dane</button></div></section>
              {refreshPrompt && <div className="api-warning"><strong>Odświeżenie pominie cache i zużyje kolejne zapytania API.</strong><div className="mt-3 flex gap-2"><button type="button" className="btn-primary" onClick={() => void loadImport(imported.fixture.id, true)}>Odśwież mimo to</button><button type="button" className="btn-secondary" onClick={() => setRefreshPrompt(false)}>Anuluj</button></div></div>}
              <TeamMatches title={`Ostatnie mecze gospodarzy — ${imported.home.team.name}`} matches={imported.home.matches} selected={homeSelected} onToggle={(id) => toggle(homeSelected, setHomeSelected, id)} />
              <TeamMatches title={`Ostatnie mecze gości — ${imported.away.team.name}`} matches={imported.away.matches} selected={awaySelected} onToggle={(id) => toggle(awaySelected, setAwaySelected, id)} />
              <section className="api-review-section"><h3 className="text-xl font-black text-white">Podsumowanie statystyk</h3><div className="mt-4 grid gap-4 lg:grid-cols-2"><AggregateSummary title={imported.home.team.name} aggregate={selectedImport.home.aggregate} /><AggregateSummary title={imported.away.team.name} aggregate={selectedImport.away.aggregate} /></div></section>
              {selectedImport.warnings.length > 0 && <section className="api-warning"><h3 className="font-black">Ostrzeżenia o brakach danych</h3><ul className="mt-3 space-y-2">{selectedImport.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></section>}
              <div className="api-odds-reminder">Uzupełnij aktualne kursy, aby obliczyć prawdopodobieństwo z kursu i edge.</div>
            </div>
          ) : (
            <div>
              <div className="api-picker-controls"><label><span>Data meczów</span><input className="admin-input" type="date" value={date} onChange={(event) => { setDate(event.target.value); setFixturesRequested(false); setFixtures([]); setError(""); }} /></label><button type="button" className="btn-primary" disabled={fixturesLoading} onClick={() => void loadFixtures()}>{fixturesLoading ? "Ładowanie meczów…" : "Pokaż mecze"}</button><label><span>Wyszukaj drużynę lub ligę</span><input className="admin-input" type="search" placeholder="np. Polska lub Liga Mistrzów" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
              {fixturesLoading && <div className="studio-message">Ładowanie meczów…</div>}
              {!fixturesLoading && fixtures.length === 0 && !error && <div className="studio-message">{fixturesRequested ? "Nie znaleziono meczów dla wybranej daty." : "Wybierz datę i kliknij „Pokaż mecze”."}</div>}
              {!fixturesLoading && fixtures.length > 0 && visibleFixtures.length === 0 && <div className="studio-message">Nie znaleziono meczów pasujących do wyszukiwania.</div>}
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleFixtures.map((fixture) => <FixtureCard key={fixture.id} fixture={fixture} onSelect={() => void loadImport(fixture.id)} />)}</div>
            </div>
          )}
          {error && <div className="studio-error" role="alert">{error}</div>}
        </div>
        <footer className="match-import-footer"><button type="button" className="btn-secondary" onClick={onClose}>Anuluj</button>{selectedImport && <button type="button" className="btn-primary" disabled={!homeSelected.length || !awaySelected.length} onClick={() => onApply(selectedImport)}>Uzupełnij formularz</button>}</footer>
      </div>
    </div>
  );
}
