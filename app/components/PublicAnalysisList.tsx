"use client";

import { useEffect, useMemo, useState } from "react";
import { getMatches } from "@/lib/storage";
import type { MatchAnalysisRecord, RiskLevel } from "@/lib/types";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { EmptyState } from "./EmptyState";
import { MatchCard } from "./MatchCard";
import { MetricCard } from "./MetricCard";

const filters = [
  { label: "wszystkie", value: "all" },
  { label: "free", value: "free" },
  { label: "premium", value: "premium" },
  { label: "low risk", value: "low" },
  { label: "medium risk", value: "medium" },
  { label: "high risk", value: "high" },
  { label: "Value Index 60+", value: "value60" },
  { label: "dzisiaj", value: "today" },
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
  const [matches, setMatches] = useState<MatchAnalysisRecord[]>([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [league, setLeague] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const load = () => {
      setMatches(getMatches().filter((match) => match.publicationStatus === "published"));
      setMounted(true);
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("analityq-storage", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("analityq-storage", load);
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
        match.settings.riskLevel === (filter as RiskLevel) ||
        (filter === "value60" && metrics.valueIndex >= 60) ||
        (filter === "today" && isToday(match.basic.kickoff));

      return matchesQuery && matchesLeague && matchesFilter;
    });
  }, [filter, league, matches, query]);

  const highestValue = matches.reduce((max, match) => {
    return Math.max(max, calculateFullReportMetrics(match).valueIndex);
  }, 0);
  const lowRiskCount = matches.filter((match) => match.settings.riskLevel === "low").length;
  const premiumCount = matches.filter((match) => match.basic.status === "premium").length;

  if (!mounted) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-64 animate-soft-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        title="Brak dostępnych analiz"
        description="Dzisiejsze raporty nie zostały jeszcze opublikowane. Wróć później lub sprawdź kolejne mecze po aktualizacji listy."
      />
    );
  }

  return (
    <>
      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Opublikowane analizy" value={String(matches.length)} note="widoczne publicznie" tone="cyan" />
        <MetricCard label="Highest Value Index" value={String(Math.round(highestValue))} note="najmocniejszy raport" tone="gold" />
        <MetricCard label="Low risk reports" value={String(lowRiskCount)} note="niższa zmienność" />
        <MetricCard label="Premium reports" value={String(premiumCount)} note="rozszerzone sekcje" />
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
          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px]">
            <input
              className="search-input"
              placeholder="Szukaj drużyny lub notatki"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <input
              className="search-input"
              placeholder="Liga"
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
