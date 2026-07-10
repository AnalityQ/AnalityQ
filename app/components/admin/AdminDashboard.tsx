"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { modelDisclaimer } from "@/lib/analityq-data";
import {
  addMatch,
  createEmptyAnalysis,
  deleteMatch,
  getMatches,
  getNextFreeSlot,
  matchesStorageKey,
} from "@/lib/storage";
import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { MetricCard } from "../MetricCard";
import { SectionHeader } from "../SectionHeader";
import { AnalysisSlots } from "./AnalysisSlots";
import { ImportExportPanel } from "./ImportExportPanel";
import { MatchForm } from "./MatchForm";

function subscribeMatches(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("analityq-storage", onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener("analityq-storage", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getMatchesSnapshot() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(matchesStorageKey) || "";
}

function getServerMatchesSnapshot() {
  return "";
}

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [editing, setEditing] = useState<MatchAnalysisRecord | null>(null);
  const storageSnapshot = useSyncExternalStore(
    subscribeMatches,
    getMatchesSnapshot,
    getServerMatchesSnapshot,
  );
  const matches = useMemo(() => {
    void storageSnapshot;
    return getMatches();
  }, [storageSnapshot]);

  const stats = useMemo(() => {
    const metrics = matches.map((match) => ({ match, metrics: calculateFullReportMetrics(match) }));
    const highestValue = metrics.reduce((max, item) => Math.max(max, item.metrics.valueIndex), 0);
    const nextMatch = [...matches]
      .filter((match) => match.basic.kickoff)
      .sort((a, b) => new Date(a.basic.kickoff).getTime() - new Date(b.basic.kickoff).getTime())[0];
    const watchlist = metrics.filter(
      (item) => item.metrics.valueIndex >= 65 && item.match.settings.riskLevel !== "high",
    );

    return {
      all: matches.length,
      draft: matches.filter((match) => match.publicationStatus === "draft").length,
      published: matches.filter((match) => match.publicationStatus === "published").length,
      archived: matches.filter((match) => match.publicationStatus === "archived").length,
      highestValue,
      nextMatch,
      watchlist,
      freeSlots: 20 - matches.length,
    };
  }, [matches]);

  function handleAdd(slotNumber?: number) {
    const slot = slotNumber || getNextFreeSlot(matches);
    if (!slot) return;
    setEditing(createEmptyAnalysis(slot));
  }

  function handleSave(analysis: MatchAnalysisRecord) {
    const saved = addMatch(analysis);
    setEditing(saved);
  }

  function handleDelete(id: string) {
    if (!window.confirm("Usunąć analizę z localStorage?")) return;
    deleteMatch(id);
  }

  function handleStatus(id: string, status: PublicationStatus) {
    const match = matches.find((item) => item.id === id);
    if (!match) return;
    addMatch({ ...match, publicationStatus: status, updatedAt: new Date().toISOString() });
  }

  return (
    <section className="section-shell">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <SectionHeader
          eyebrow="Admin"
          title="Panel analiz AnalityQ"
          description="Ręczne tworzenie raportów, obliczanie edge, publikacja i lokalna baza danych w localStorage."
        />
        <button type="button" className="btn-secondary w-fit" onClick={onLogout}>
          Wyloguj z panelu
        </button>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Wszystkie analizy" value={String(stats.all)} note="maksymalnie 20 slotów" tone="cyan" />
        <MetricCard label="Draft" value={String(stats.draft)} note="widoczne tylko adminowi" />
        <MetricCard label="Published" value={String(stats.published)} note="widoczne publicznie" tone="gold" />
        <MetricCard label="Archived" value={String(stats.archived)} note="ukryte stare raporty" />
        <MetricCard label="Najwyższy Value Index" value={String(Math.round(stats.highestValue))} note="z lokalnych analiz" tone="gold" />
        <MetricCard
          label="Najbliższy mecz"
          value={stats.nextMatch ? `${stats.nextMatch.basic.homeTeam || "?"} vs ${stats.nextMatch.basic.awayTeam || "?"}` : "brak"}
          note={stats.nextMatch?.basic.kickoff || "uzupełnij datę"}
        />
        <MetricCard label="Watchlist" value={String(stats.watchlist.length)} note="Value Index 65+ i risk nie high" tone="cyan" />
        <MetricCard label="Wolne sloty" value={String(stats.freeSlots)} note="z 20 dostępnych" />
      </div>

      {stats.watchlist.length > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[0.07] p-5">
          <h2 className="text-xl font-black text-white">Watchlist</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {stats.watchlist.map(({ match, metrics }) => (
              <div key={match.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="font-black text-white">
                  {match.basic.homeTeam || "Gospodarz"} vs {match.basic.awayTeam || "Gość"}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Value Index {Math.round(metrics.valueIndex)} · {metrics.bestValueMarket}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImportExportPanel onChange={() => window.dispatchEvent(new Event("analityq-storage"))} />

      <div className="mt-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Sloty dzisiejszych analiz</p>
            <h2 className="mt-2 text-3xl font-black text-white">20 slotów raportów</h2>
          </div>
          <button type="button" className="btn-primary w-fit justify-center" onClick={() => handleAdd()}>
            Dodaj analizę
          </button>
        </div>
        <AnalysisSlots
          matches={matches}
          onAdd={handleAdd}
          onEdit={setEditing}
          onDelete={handleDelete}
          onStatus={handleStatus}
        />
      </div>

      {editing && (
        <div className="mt-12">
          <MatchForm analysis={editing} onCancel={() => setEditing(null)} onSave={handleSave} allMatches={matches} />
        </div>
      )}

      <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
        {modelDisclaimer}
      </p>
    </section>
  );
}
