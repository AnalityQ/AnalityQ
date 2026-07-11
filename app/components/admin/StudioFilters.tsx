"use client";

import type { EffectiveRiskLevel, PublicationStatus } from "@/lib/types";

export type StudioTab = "all" | PublicationStatus;
export type StudioSort = "kickoff-asc" | "kickoff-desc" | "value-desc" | "completeness-desc" | "updated-desc";

export function StudioFilters({
  tab,
  query,
  sort,
  risk,
  completeness,
  onTab,
  onQuery,
  onSort,
  onRisk,
  onCompleteness,
}: {
  tab: StudioTab;
  query: string;
  sort: StudioSort;
  risk: "all" | EffectiveRiskLevel;
  completeness: "all" | "low" | "basic" | "good" | "complete";
  onTab: (value: StudioTab) => void;
  onQuery: (value: string) => void;
  onSort: (value: StudioSort) => void;
  onRisk: (value: "all" | EffectiveRiskLevel) => void;
  onCompleteness: (value: "all" | "low" | "basic" | "good" | "complete") => void;
}) {
  const tabs: Array<[StudioTab, string]> = [["all", "Wszystkie"], ["draft", "Szkice"], ["published", "Opublikowane"], ["archived", "Zarchiwizowane"]];

  return (
    <div className="studio-filters">
      <div className="studio-filter-tabs">
        {tabs.map(([value, label]) => <button key={value} type="button" className={tab === value ? "active" : ""} onClick={() => onTab(value)}>{label}</button>)}
      </div>
      <div className="studio-filter-grid">
        <input className="admin-input" type="search" placeholder="Szukaj drużyny lub ligi" value={query} onChange={(event) => onQuery(event.target.value)} />
        <select className="admin-input" value={sort} onChange={(event) => onSort(event.target.value as StudioSort)} aria-label="Sortowanie">
          <option value="kickoff-asc">Data meczu — najbliższe</option>
          <option value="kickoff-desc">Data meczu — najpóźniejsze</option>
          <option value="value-desc">Najwyższy Value Index</option>
          <option value="completeness-desc">Najwyższa kompletność</option>
          <option value="updated-desc">Ostatnio aktualizowane</option>
        </select>
        <select className="admin-input" value={risk} onChange={(event) => onRisk(event.target.value as "all" | EffectiveRiskLevel)} aria-label="Poziom ryzyka">
          <option value="all">Każdy poziom ryzyka</option><option value="low">Niskie ryzyko</option><option value="medium">Średnie ryzyko</option><option value="high">Wysokie ryzyko</option>
        </select>
        <select className="admin-input" value={completeness} onChange={(event) => onCompleteness(event.target.value as "all" | "low" | "basic" | "good" | "complete")} aria-label="Kompletność danych">
          <option value="all">Każda kompletność</option><option value="low">0–39% — niska</option><option value="basic">40–69% — podstawowa</option><option value="good">70–89% — dobra</option><option value="complete">90–100% — kompletna</option>
        </select>
      </div>
    </div>
  );
}
