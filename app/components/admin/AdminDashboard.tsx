"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { modelDisclaimer } from "@/lib/analityq-data";
import {
  archiveAnalysis,
  createAnalysis,
  databaseChangeEvent,
  deleteAnalysis,
  getAllAnalyses,
  getStudioDatabaseErrorMessage,
  publishAnalysis,
  unpublishAnalysis,
  updateAnalysis,
} from "@/lib/database";
import { createEmptyAnalysis, getNextFreeSlot } from "@/lib/storage";
import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { getPublicationLabel } from "../Badges";
import { Logo } from "../Logo";
import { MetricCard } from "../MetricCard";
import { AnalysisSlots } from "./AnalysisSlots";
import { ImportExportPanel } from "./ImportExportPanel";
import { LocalMigrationPanel } from "./LocalMigrationPanel";
import { MatchForm } from "./MatchForm";
import { QuickAddForm } from "./QuickAddForm";

type EditorMode = "quick" | "full";

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [editing, setEditing] = useState<MatchAnalysisRecord | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>("quick");
  const [matches, setMatches] = useState<MatchAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [debugMessage, setDebugMessage] = useState("");
  const [notice, setNotice] = useState("");

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setDebugMessage("");

    try {
      const data = await getAllAnalyses();
      setMatches(data);
    } catch (error) {
      setMatches([]);
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setDebugMessage(error instanceof Error ? error.message : "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMatches();
    }, 0);
    window.addEventListener(databaseChangeEvent, loadMatches);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(databaseChangeEvent, loadMatches);
    };
  }, [loadMatches]);

  const stats = useMemo(() => {
    const metrics = matches.map((match) => ({ match, metrics: calculateFullReportMetrics(match) }));
    const highestValue = metrics.reduce((max, item) => Math.max(max, item.metrics.valueIndex), 0);
    const nextMatch = [...matches]
      .filter((match) => match.basic.kickoff)
      .sort((a, b) => new Date(a.basic.kickoff).getTime() - new Date(b.basic.kickoff).getTime())[0];
    const watchlist = metrics.filter(
      (item) => item.metrics.valueIndex >= 65 && item.metrics.effectiveRiskLevel !== "high",
    );

    return {
      all: matches.length,
      draft: matches.filter((match) => match.publicationStatus === "draft").length,
      published: matches.filter((match) => match.publicationStatus === "published").length,
      archived: matches.filter((match) => match.publicationStatus === "archived").length,
      highestValue,
      nextMatch,
      watchlist,
      freeSlots: Math.max(0, 20 - matches.length),
    };
  }, [matches]);

  function openEditor(mode: EditorMode, slotNumber?: number) {
    const slot = slotNumber || getNextFreeSlot(matches);
    if (!slot) return;
    setEditorMode(mode);
    setEditing(createEmptyAnalysis(slot));
  }

  function handleEdit(match: MatchAnalysisRecord) {
    setEditorMode("full");
    setEditing(match);
  }

  async function handleSave(analysis: MatchAnalysisRecord) {
    const isExisting = matches.some((item) => item.id === analysis.id);
    setErrorMessage("");
    setDebugMessage("");

    try {
      const saved = isExisting ? await updateAnalysis(analysis.id, analysis) : await createAnalysis(analysis);
      setEditing(saved);
      setEditorMode("full");
      setNotice(!isExisting && editorMode === "quick" ? "Analiza została zapisana jako szkic." : "Zmiany zostały zapisane.");
      await loadMatches();
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setDebugMessage(error instanceof Error ? error.message : "");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Czy na pewno chcesz usunąć tę analizę? Tej operacji nie można cofnąć.")) return;
    setErrorMessage("");
    setDebugMessage("");

    try {
      await deleteAnalysis(id);
      if (editing?.id === id) setEditing(null);
      setNotice("Analiza została usunięta.");
      await loadMatches();
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setDebugMessage(error instanceof Error ? error.message : "");
    }
  }

  async function handleStatus(id: string, status: PublicationStatus) {
    setErrorMessage("");
    setDebugMessage("");

    try {
      const saved =
        status === "published"
          ? await publishAnalysis(id)
          : status === "archived"
            ? await archiveAnalysis(id)
            : await unpublishAnalysis(id);

      if (editing?.id === id) setEditing(saved);
      setNotice(
        status === "published"
          ? "Analiza została opublikowana."
          : status === "archived"
            ? "Analiza została zarchiwizowana."
            : "Analiza została przywrócona jako szkic.",
      );
      await loadMatches();
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setDebugMessage(error instanceof Error ? error.message : "");
    }
  }

  return (
    <section className="section-shell">
      <div className="studio-hero">
        <div>
          <Logo href="" />
          <p className="eyebrow mt-8">Ukryta przestrzeń robocza</p>
          <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Studio AnalityQ</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
            Prywatny panel do ręcznego tworzenia raportów, zapisu w Supabase, publikacji i pracy na 20 slotach
            analiz.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <button type="button" className="btn-primary justify-center" onClick={() => openEditor("quick")}>
            Szybkie dodawanie
          </button>
          <button type="button" className="btn-secondary justify-center" onClick={() => openEditor("full")}>
            Pełna analiza
          </button>
          <button type="button" className="btn-secondary justify-center" onClick={onLogout}>
            Wyloguj z panelu
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-8 rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.06] p-4 text-sm font-bold text-cyan-100">
          Ładowanie analiz...
        </div>
      )}

      {errorMessage && (
        <div className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[0.07] p-5">
          <p className="font-black text-amber-100">{errorMessage}</p>
          {debugMessage && (
            <p className="mt-3 break-words text-xs leading-6 text-slate-400">
              Szczegóły techniczne: {debugMessage}
            </p>
          )}
        </div>
      )}

      {notice && (
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.06] p-5 md:flex-row md:items-center">
          <p className="text-sm font-bold text-cyan-100">{notice}</p>
          {editing && (
            <div className="flex flex-col gap-3 sm:flex-row">
              {editing.publicationStatus !== "published" && (
                <button
                  type="button"
                  className="btn-primary justify-center"
                  onClick={() => void handleStatus(editing.id, "published")}
                >
                  Opublikuj
                </button>
              )}
              <Link href={`/analizy/${editing.slug}`} className="btn-secondary justify-center">
                Otwórz raport
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Wszystkie analizy" value={String(stats.all)} note="maksymalnie 20 slotów" tone="cyan" />
        <MetricCard label={getPublicationLabel("draft")} value={String(stats.draft)} note="widoczne tylko w studio" />
        <MetricCard label={getPublicationLabel("published")} value={String(stats.published)} note="widoczne publicznie" tone="gold" />
        <MetricCard label={getPublicationLabel("archived")} value={String(stats.archived)} note="ukryte stare raporty" />
        <MetricCard label="Najwyższy Value Index" value={String(Math.round(stats.highestValue))} note="z bazy online" tone="gold" />
        <MetricCard
          label="Najbliższy mecz"
          value={stats.nextMatch ? `${stats.nextMatch.basic.homeTeam || "?"} vs ${stats.nextMatch.basic.awayTeam || "?"}` : "brak"}
          note={stats.nextMatch?.basic.kickoff || "uzupełnij datę"}
        />
        <MetricCard label="Watchlista" value={String(stats.watchlist.length)} note="Value Index 65+ i ryzyko inne niż wysokie" tone="cyan" />
        <MetricCard label="Wolne sloty" value={String(stats.freeSlots)} note="z 20 dostępnych" />
      </div>

      {stats.watchlist.length > 0 && (
        <div className="mt-8 rounded-2xl border border-amber-200/20 bg-amber-200/[0.07] p-5">
          <h2 className="text-xl font-black text-white">Watchlista</h2>
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

      <div className="mt-12">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="eyebrow">Sloty dzisiejszych analiz</p>
            <h2 className="mt-2 text-3xl font-black text-white">20 slotów raportów</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-primary justify-center" onClick={() => openEditor("quick")}>
              Szybkie dodawanie
            </button>
            <button type="button" className="btn-secondary justify-center" onClick={() => openEditor("full")}>
              Pełna analiza
            </button>
          </div>
        </div>
        <AnalysisSlots
          matches={matches}
          onAdd={(slot) => openEditor("quick", slot)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatus={handleStatus}
        />
      </div>

      {editing && (
        <div className="mt-12">
          {editorMode === "quick" ? (
            <QuickAddForm analysis={editing} onCancel={() => setEditing(null)} onSave={handleSave} allMatches={matches} />
          ) : (
            <MatchForm analysis={editing} onCancel={() => setEditing(null)} onSave={handleSave} allMatches={matches} />
          )}
        </div>
      )}

      <LocalMigrationPanel onChange={loadMatches} />

      <ImportExportPanel onChange={loadMatches} />

      <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">
        {modelDisclaimer}
      </p>
    </section>
  );
}
