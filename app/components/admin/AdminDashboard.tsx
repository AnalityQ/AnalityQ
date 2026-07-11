"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { calculateFullReportMetrics } from "@/lib/calculations";
import { applyFootballImportToAnalysis } from "@/lib/football-api/apply-import";
import type { FootballMatchImport } from "@/lib/football-api/types";
import { modelDisclaimer } from "@/lib/analityq-data";
import {
  archiveAnalysis,
  createAnalysis,
  databaseChangeEvent,
  deleteAnalysis,
  duplicateAnalysis,
  getAllAnalyses,
  getStudioDatabaseErrorMessage,
  publishAnalysis,
  unpublishAnalysis,
  updateAnalysis,
} from "@/lib/database";
import { createEmptyAnalysis, getNextFreeSlot } from "@/lib/storage";
import type { MatchAnalysisRecord, PublicationStatus } from "@/lib/types";
import { Logo } from "../Logo";
import { MetricCard } from "../MetricCard";
import { AnalysisFormModal, type AnalysisEditorMode } from "./AnalysisFormModal";
import { AnalysisToast } from "./AnalysisToast";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImportExportPanel } from "./ImportExportPanel";
import { LocalMigrationPanel } from "./LocalMigrationPanel";
import { MatchImportModal } from "./MatchImportModal";
import { StudioAnalysisCard } from "./StudioAnalysisCard";
import { StudioFilters, type StudioSort, type StudioTab } from "./StudioFilters";

type EditorState = { analysis: MatchAnalysisRecord; mode: AnalysisEditorMode } | null;

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [editor, setEditor] = useState<EditorState>(null);
  const [matches, setMatches] = useState<MatchAnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<StudioTab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<StudioSort>("updated-desc");
  const [risk, setRisk] = useState<"all" | "low" | "medium" | "high">("all");
  const [completeness, setCompleteness] = useState<"all" | "low" | "basic" | "good" | "complete">("all");
  const [publishConfirmation, setPublishConfirmation] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setMatches(await getAllAnalyses());
    } catch (error) {
      setMatches([]);
      setErrorMessage(getStudioDatabaseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadMatches(), 0);
    window.addEventListener(databaseChangeEvent, loadMatches);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(databaseChangeEvent, loadMatches);
    };
  }, [loadMatches]);

  const measured = useMemo(() => matches.map((match) => ({ match, metrics: calculateFullReportMetrics(match) })), [matches]);
  const stats = useMemo(() => ({
    all: matches.length,
    draft: matches.filter((match) => match.publicationStatus === "draft").length,
    published: matches.filter((match) => match.publicationStatus === "published").length,
    archived: matches.filter((match) => match.publicationStatus === "archived").length,
    highestValue: measured.reduce((max, item) => Math.max(max, item.metrics.valueIndex ?? 0), 0),
    averageCompleteness: measured.length ? Math.round(measured.reduce((sum, item) => sum + item.metrics.dataCompleteness.percent, 0) / measured.length) : 0,
    freeSlots: Math.max(0, 20 - matches.length),
  }), [matches, measured]);

  const filtered = useMemo(() => measured.filter(({ match, metrics }) => {
    const haystack = `${match.basic.homeTeam} ${match.basic.awayTeam} ${match.basic.league}`.toLowerCase();
    const completenessGroup = metrics.dataCompleteness.percent < 40 ? "low" : metrics.dataCompleteness.percent < 70 ? "basic" : metrics.dataCompleteness.percent < 90 ? "good" : "complete";
    return (tab === "all" || match.publicationStatus === tab)
      && (!query.trim() || haystack.includes(query.toLowerCase().trim()))
      && (risk === "all" || metrics.effectiveRiskLevel === risk)
      && (completeness === "all" || completenessGroup === completeness);
  }).sort((a, b) => {
    if (sort === "value-desc") return (b.metrics.valueIndex ?? -1) - (a.metrics.valueIndex ?? -1);
    if (sort === "completeness-desc") return b.metrics.dataCompleteness.percent - a.metrics.dataCompleteness.percent;
    if (sort === "updated-desc") return new Date(b.match.updatedAt).getTime() - new Date(a.match.updatedAt).getTime();
    const aDate = a.match.basic.kickoff ? new Date(a.match.basic.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.match.basic.kickoff ? new Date(b.match.basic.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
    return sort === "kickoff-desc" ? bDate - aDate : aDate - bDate;
  }), [completeness, measured, query, risk, sort, tab]);

  const freeSlots = useMemo(() => Array.from({ length: 20 }, (_, index) => index + 1).filter((slot) => !matches.some((match) => match.slotNumber === slot)), [matches]);

  function openEditor(mode: AnalysisEditorMode, slotNumber?: number) {
    const slot = slotNumber ?? getNextFreeSlot(matches);
    if (!slot) {
      setToast("Brak wolnego slotu na nową analizę.");
      return;
    }
    setEditor({ analysis: createEmptyAnalysis(slot), mode });
  }

  function handleImportedMatch(imported: FootballMatchImport) {
    const slot = getNextFreeSlot(matches);
    if (!slot) {
      setToast("Brak wolnego slotu na zaimportowaną analizę.");
      return;
    }
    const analysis = applyFootballImportToAnalysis(createEmptyAnalysis(slot), imported);
    setEditor({ analysis, mode: "quick" });
    setImportOpen(false);
    setToast("Dane meczu uzupełniły formularz. Sprawdź je i dodaj aktualne kursy.");
  }

  async function handleSave(analysis: MatchAnalysisRecord, status: PublicationStatus) {
    setErrorMessage("");
    try {
      const exists = matches.some((item) => item.id === analysis.id);
      const saved = exists ? await updateAnalysis(analysis.id, analysis) : await createAnalysis(analysis);
      setEditor((current) => current ? { ...current, analysis: saved } : null);
      setToast(status === "published" ? "Analiza została opublikowana." : exists ? "Zmiany zostały zapisane." : "Analiza została zapisana jako szkic.");
      await loadMatches();
      return saved;
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setToast("Nie udało się zapisać zmian.");
      throw error;
    }
  }

  async function handleStatus(id: string, status: PublicationStatus, confirmed = false) {
    const item = matches.find((match) => match.id === id);
    if (status === "published" && item) {
      const complete = calculateFullReportMetrics(item).dataCompleteness.percent;
      const hasBothTeamStats = (["home", "away"] as const).every((team) =>
        Object.entries(item.manualStats[team]).some(([key, value]) => key !== "formLast5" && typeof value === "number"),
      );
      if ((complete < 50 || !hasBothTeamStats) && !confirmed) {
        setPublishConfirmation(id);
        return;
      }
    }
    try {
      if (status === "published") await publishAnalysis(id);
      else if (status === "archived") await archiveAnalysis(id);
      else await unpublishAnalysis(id);
      setToast(status === "published" ? "Analiza została opublikowana." : status === "archived" ? "Analiza została zarchiwizowana." : "Publikacja została cofnięta.");
      await loadMatches();
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setToast("Nie udało się zapisać zmian.");
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const duplicated = await duplicateAnalysis(id);
      setToast("Analiza została zduplikowana.");
      await loadMatches();
      setEditor({ analysis: duplicated, mode: "full" });
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setToast("Nie udało się zduplikować analizy.");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Czy na pewno chcesz usunąć tę analizę? Tej operacji nie można cofnąć.")) return;
    try {
      await deleteAnalysis(id);
      if (editor?.analysis.id === id) setEditor(null);
      setToast("Analiza została usunięta.");
      await loadMatches();
    } catch (error) {
      setErrorMessage(getStudioDatabaseErrorMessage(error));
      setToast("Nie udało się zapisać zmian.");
    }
  }

  return (
    <section className="section-shell studio-shell">
      <div className="studio-hero">
        <div><Logo href="" /><p className="eyebrow mt-8">Ukryta przestrzeń robocza</p><h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Studio AnalityQ</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">Szybkie tworzenie, kontrola jakości danych i publikacja profesjonalnych raportów statystycznych.</p></div>
        <button type="button" className="btn-secondary" onClick={onLogout}>Wyloguj z panelu</button>
      </div>

      <div className="studio-create-bar">
        <div><strong>Utwórz raport</strong><span>Formularz otworzy się natychmiast w panelu.</span></div>
        <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>Pobierz dane meczu</button>
        <button type="button" className="btn-primary" onClick={() => openEditor("quick")}>Szybka analiza</button>
        <button type="button" className="btn-secondary" onClick={() => openEditor("full")}>Pełna analiza</button>
      </div>

      {loading && <div className="studio-message">Ładowanie analiz…</div>}
      {errorMessage && <div className="studio-error" role="alert">{errorMessage}</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Wszystkie analizy" value={String(stats.all)} note={`${stats.freeSlots} wolnych slotów`} tone="cyan" />
        <MetricCard label="Szkice / opublikowane" value={`${stats.draft} / ${stats.published}`} note={`${stats.archived} w archiwum`} />
        <MetricCard label="Najwyższy Value Index" value={stats.highestValue ? String(Math.round(stats.highestValue)) : "—"} note="na podstawie wiarygodnych danych" tone="gold" />
        <MetricCard label="Średnia kompletność" value={`${stats.averageCompleteness}%`} note="dla wszystkich analiz" />
      </div>

      <div className="mt-8"><StudioFilters tab={tab} query={query} sort={sort} risk={risk} completeness={completeness} onTab={setTab} onQuery={setQuery} onSort={setSort} onRisk={setRisk} onCompleteness={setCompleteness} /></div>

      {filtered.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map(({ match }) => <StudioAnalysisCard key={match.id} match={match} onEdit={(analysis) => setEditor({ analysis, mode: "full" })} onDelete={(id) => void handleDelete(id)} onDuplicate={(id) => void handleDuplicate(id)} onStatus={(id, status) => void handleStatus(id, status)} />)}</div> : !loading && <div className="studio-message mt-6">Brak analiz pasujących do wybranych filtrów.</div>}

      {freeSlots.length > 0 && (
        <div className="mt-10 rounded-3xl border border-dashed border-cyan-200/20 bg-cyan-200/[0.035] p-5">
          <div><p className="eyebrow">Wolne miejsca</p><h2 className="mt-2 text-xl font-black text-white">Kliknij pusty slot, aby od razu rozpocząć</h2></div>
          <div className="mt-4 flex flex-wrap gap-2">{freeSlots.map((slot) => <button key={slot} type="button" className="empty-slot-button" onClick={() => openEditor("quick", slot)}>Slot {String(slot).padStart(2, "0")}</button>)}</div>
        </div>
      )}

      <details className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5"><summary className="cursor-pointer font-black text-white">Narzędzia danych i migracji</summary><div className="mt-6"><LocalMigrationPanel onChange={loadMatches} /><ImportExportPanel onChange={loadMatches} /></div></details>
      <p className="mt-8 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-xs leading-6 text-slate-400">{modelDisclaimer}</p>

      {editor && <AnalysisFormModal key={editor.analysis.id} analysis={editor.analysis} allMatches={matches} mode={editor.mode} onModeChange={(mode) => setEditor((current) => current ? { ...current, mode } : null)} onClose={() => setEditor(null)} onSave={handleSave} onNotify={setToast} />}
      {toast && <AnalysisToast message={toast} onClose={() => setToast("")} />}
      {publishConfirmation && <ConfirmDialog title="Opublikować analizę z małą ilością danych?" message="Analiza zawiera mało danych. Raport może mieć niższą pewność i powinien być traktowany jako wstępny." confirmLabel="Opublikuj mimo ostrzeżenia" onCancel={() => setPublishConfirmation(null)} onConfirm={() => { const id = publishConfirmation; setPublishConfirmation(null); void handleStatus(id, "published", true); }} />}
      {importOpen && <MatchImportModal onClose={() => setImportOpen(false)} onApply={handleImportedMatch} />}

      <div className="studio-mobile-create-bar"><button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>Pobierz dane</button><button type="button" className="btn-primary" onClick={() => openEditor("quick")}>Szybka analiza</button><button type="button" className="btn-secondary" onClick={() => openEditor("full")}>Pełna analiza</button></div>
    </section>
  );
}
