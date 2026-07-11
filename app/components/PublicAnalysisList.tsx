"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import {
  databaseChangeEvent,
  getPublicDatabaseErrorMessage,
  getPublishedAnalyses,
} from "@/lib/database";
import type { MatchAnalysisRecord } from "@/lib/types";
import { EmptyState } from "./EmptyState";
import { MatchCard } from "./MatchCard";
import { MetricCard } from "./MetricCard";

const filters = [
  { label: "Wszystkie", value: "all" },
  { label: "Darmowe", value: "free" },
  { label: "Premium", value: "premium" },
  { label: "Niskie ryzyko", value: "low" },
  { label: "Średnie ryzyko", value: "medium" },
  { label: "Wysokie ryzyko", value: "high" },
  { label: "Value Index 60+", value: "value60" },
  { label: "Dzisiaj", value: "today" },
];

function isToday(value: string) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function PublicAnalysisList() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("");
  const [sort, setSort] = useState("upcoming");
  const [matches, setMatches] = useState<MatchAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await getPublishedAnalyses();
        if (active) setMatches(data);
      } catch (error) {
        if (active) {
          setMatches([]);
          setErrorMessage(getPublicDatabaseErrorMessage(error));
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    window.addEventListener(databaseChangeEvent, load);

    return () => {
      active = false;
      window.removeEventListener(databaseChangeEvent, load);
    };
  }, []);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const metrics = calculateFullReportMetrics(match);
      const haystack = `${match.basic.league} ${match.basic.country} ${match.basic.homeTeam} ${match.basic.awayTeam} ${match.notes.summary}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase());
      const matchesLeague = !league.trim() || match.basic.league.toLowerCase().includes(league.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        match.basic.status === filter ||
        metrics.effectiveRiskLevel === filter ||
        (filter === "value60" && metrics.valueIndex !== null && metrics.valueIndex >= 60) ||
        (filter === "today" && isToday(match.basic.kickoff));

      return matchesQuery && matchesLeague && matchesFilter;
    }).sort((a, b) => {
      const aMetrics = calculateFullReportMetrics(a);
      const bMetrics = calculateFullReportMetrics(b);
      if (sort === "value") return (bMetrics.valueIndex ?? -1) - (aMetrics.valueIndex ?? -1);
      if (sort === "completeness") return bMetrics.dataCompleteness.percent - aMetrics.dataCompleteness.percent;
      if (sort === "newest") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      const aTime = a.basic.kickoff ? new Date(a.basic.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.basic.kickoff ? new Date(b.basic.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [filter, league, matches, query, sort]);

  if (loading) {
    return (
      <div>
        <p className="mb-4 text-sm font-bold text-cyan-100">Ładowanie analiz...</p>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-64 animate-soft-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <EmptyState
        title="Nie udało się wczytać analiz"
        description={errorMessage}
      />
    );
  }

  const highestValue = matches.reduce((max, match) => {
    return Math.max(max, calculateFullReportMetrics(match).valueIndex ?? 0);
  }, 0);
  const lowRiskCount = matches.filter((match) => calculateFullReportMetrics(match).effectiveRiskLevel === "low").length;
  const premiumCount = matches.filter((match) => match.basic.status === "premium").length;

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Brak dostępnych analiz"
        description="Dzisiejsze raporty nie zostały jeszcze opublikowane. Wróć później po aktualizacji listy."
      />
    );
  }

  return (
    <>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Opublikowane analizy" value={String(matches.length)} note="widoczne publicznie" tone="cyan" />
        <MetricCard label="Najwyższy Value Index" value={String(Math.round(highestValue))} note="najmocniejszy raport" tone="gold" />
        <MetricCard label="Raporty niskiego ryzyka" value={String(lowRiskCount)} note="niższa zmienność" />
        <MetricCard label="Raporty Premium" value={String(premiumCount)} note="rozszerzone sekcje" />
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setFilter(item.value)}
                className={`filter-chip ${filter === item.value ? "filter-chip-active" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[760px]">
            <input
              className="search-input"
              placeholder="Szukaj drużyny lub ligi"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="search-input" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sortuj analizy">
              <option value="upcoming">Najbliższe mecze</option>
              <option value="value">Najwyższy Value Index</option>
              <option value="completeness">Najwyższa kompletność danych</option>
              <option value="newest">Najnowsze analizy</option>
            </select>
            <input
              className="search-input"
              placeholder="Filtruj po lidze"
              value={league}
              onChange={(event) => setLeague(event.target.value)}
            />
          </div>
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Brak wyników dla filtrów"
            description="Zmień filtr, ligę lub wyszukiwane słowo, aby zobaczyć dostępne raporty."
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </>
  );
}
