"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateFullReportMetrics, marketDefinitions, safeNumber } from "@/lib/calculations";
import { applyFootballImportToAnalysis } from "@/lib/football-api/apply-import";
import type { FootballMatchImport } from "@/lib/football-api/types";
import { normalizeAnalysis } from "@/lib/storage";
import { studioSessionExpiredEvent } from "@/lib/studio-auth";
import type {
  AccessStatus,
  DataLevel,
  MarketKey,
  MatchAnalysisRecord,
  NumericValue,
  PublicationStatus,
  RiskLevel,
  TeamManualStats,
} from "@/lib/types";
import { Logo } from "../Logo";
import { DraftAutosaveStatus, type AutosaveState } from "./DraftAutosaveStatus";
import { ModelLivePreview } from "./ModelLivePreview";
import { MatchImportModal } from "./MatchImportModal";
import { ConfirmDialog } from "./ConfirmDialog";

export type AnalysisEditorMode = "quick" | "full";

const statFields: Array<{ key: keyof TeamManualStats; label: string; text?: boolean }> = [
  { key: "goalsForLast5", label: "Gole strzelone" },
  { key: "goalsAgainstLast5", label: "Gole stracone" },
  { key: "cornersForLast5", label: "Rzuty rożne wykonane" },
  { key: "cornersAgainstLast5", label: "Rzuty rożne przeciwników" },
  { key: "cardsForLast5", label: "Kartki" },
  { key: "cardsAgainstLast5", label: "Kartki przeciwników" },
  { key: "shotsForLast5", label: "Strzały" },
  { key: "shotsAgainstLast5", label: "Strzały przeciwników" },
  { key: "xgForLast5", label: "xG" },
  { key: "xgAgainstLast5", label: "xG przeciwko" },
  { key: "formLast5", label: "Forma W/D/L", text: true },
];

const quickStatFields = statFields.filter((field) => field.key !== "cardsAgainstLast5");

const tabs = [
  ["match", "Dane meczu"],
  ["home", "Statystyki gospodarzy"],
  ["away", "Statystyki gości"],
  ["odds", "Kursy"],
  ["model", "Obliczenia modelu"],
  ["lineups", "Składy i absencje"],
  ["notes", "Notatki"],
  ["premium", "Sekcje Premium"],
  ["publication", "Ustawienia publikacji"],
] as const;

type Tab = (typeof tabs)[number][0];

function draftStorageKey(analysis: MatchAnalysisRecord, allMatches: MatchAnalysisRecord[]) {
  return allMatches.some((match) => match.id === analysis.id)
    ? `analityq.form-draft.${analysis.id}`
    : `analityq.form-draft.new-slot-${analysis.slotNumber}`;
}

function inputValue(value: NumericValue | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function Field({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">
        {label}{required && <span className="ml-1 text-amber-200">*</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function SourceHint({ value }: { value: "api" | "mixed" | "missing" | "manual" }) {
  if (value === "manual") return null;
  const label = value === "api" ? "Pobrane z API" : value === "mixed" ? "Zmienione ręcznie" : "Brak danych";
  return <small className={`field-source field-source-${value}`}>{label}</small>;
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="admin-form-section">
      <h3 className="text-xl font-black text-white">{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TeamFields({
  team,
  fields,
  draft,
  onChange,
  sourceFor,
}: {
  team: "home" | "away";
  fields: typeof statFields;
  draft: MatchAnalysisRecord;
  onChange: (team: "home" | "away", key: keyof TeamManualStats, value: string) => void;
  sourceFor: (key: string, value: unknown) => "api" | "mixed" | "missing" | "manual";
}) {
  return (
    <>
      {fields.map((field) => (
        <Field key={`${team}-${field.key}`} label={field.label}>
          <input
            className="admin-input"
            type={field.text ? "text" : "number"}
            step={field.text ? undefined : "0.01"}
            value={field.text ? String(draft.manualStats[team][field.key] || "") : inputValue(draft.manualStats[team][field.key] as NumericValue)}
            onChange={(event) => onChange(team, field.key, event.target.value)}
            placeholder={field.text ? "np. W,W,D,L,W" : undefined}
          />
          <SourceHint value={sourceFor(`${team}.${field.key}`, draft.manualStats[team][field.key])} />
        </Field>
      ))}
    </>
  );
}

function RequiredMatchFields({
  draft,
  updateBasic,
  firstInputRef,
  sourceFor,
}: {
  draft: MatchAnalysisRecord;
  updateBasic: <K extends keyof MatchAnalysisRecord["basic"]>(key: K, value: MatchAnalysisRecord["basic"][K]) => void;
  firstInputRef: React.RefObject<HTMLInputElement | null>;
  sourceFor: (key: string, value: unknown) => "api" | "mixed" | "missing" | "manual";
}) {
  return (
    <>
      <Field label="Liga" required>
        <input ref={firstInputRef} className="admin-input" value={draft.basic.league} onChange={(event) => updateBasic("league", event.target.value)} /><SourceHint value={sourceFor("basic.league", draft.basic.league)} />
      </Field>
      <Field label="Kraj">
        <input className="admin-input" value={draft.basic.country} onChange={(event) => updateBasic("country", event.target.value)} /><SourceHint value={sourceFor("basic.country", draft.basic.country)} />
      </Field>
      <Field label="Gospodarz" required>
        <input className="admin-input" value={draft.basic.homeTeam} onChange={(event) => updateBasic("homeTeam", event.target.value)} /><SourceHint value={sourceFor("basic.homeTeam", draft.basic.homeTeam)} />
      </Field>
      <Field label="Gość" required>
        <input className="admin-input" value={draft.basic.awayTeam} onChange={(event) => updateBasic("awayTeam", event.target.value)} /><SourceHint value={sourceFor("basic.awayTeam", draft.basic.awayTeam)} />
      </Field>
      <Field label="Data i godzina" required>
        <input className="admin-input" type="datetime-local" value={draft.basic.kickoff} onChange={(event) => updateBasic("kickoff", event.target.value)} /><SourceHint value={sourceFor("basic.kickoff", draft.basic.kickoff)} />
      </Field>
      <Field label="Stadion / miejsce meczu">
        <input className="admin-input" value={draft.basic.venue} onChange={(event) => updateBasic("venue", event.target.value)} /><SourceHint value={sourceFor("basic.venue", draft.basic.venue)} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Link do źródła danych">
          <input className="admin-input" type="url" value={draft.basic.fotmobUrl} onChange={(event) => updateBasic("fotmobUrl", event.target.value)} />
        </Field>
      </div>
    </>
  );
}

export function AnalysisFormModal({
  analysis,
  allMatches,
  mode,
  startOnOdds = false,
  onModeChange,
  onClose,
  onSave,
  onNotify,
}: {
  analysis: MatchAnalysisRecord;
  allMatches: MatchAnalysisRecord[];
  mode: AnalysisEditorMode;
  startOnOdds?: boolean;
  onModeChange: (mode: AnalysisEditorMode) => void;
  onClose: () => void;
  onSave: (analysis: MatchAnalysisRecord, status: PublicationStatus) => Promise<MatchAnalysisRecord>;
  onNotify: (message: string) => void;
}) {
  const [draft, setDraft] = useState<MatchAnalysisRecord>(() => ({
    ...analysis,
    publicationStatus: analysis.publicationStatus || "draft",
  }));
  const [activeTab, setActiveTab] = useState<Tab>(startOnOdds ? "odds" : "match");
  const [autosaveState, setAutosaveState] = useState<AutosaveState>("saved");
  const [validationMessage, setValidationMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [storedDraft, setStoredDraft] = useState<MatchAnalysisRecord | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<FootballMatchImport | null>(null);
  const [confirmReimport, setConfirmReimport] = useState(false);
  const [overwriteApproved, setOverwriteApproved] = useState(false);
  const [manualOverrides, setManualOverrides] = useState<Set<string>>(() => new Set());
  const firstInputRef = useRef<HTMLInputElement>(null);
  const firstOddsRef = useRef<HTMLInputElement>(null);
  const normalizedDraft = useMemo(() => normalizeAnalysis(draft, allMatches), [allMatches, draft]);
  const metrics = useMemo(() => calculateFullReportMetrics(normalizedDraft), [normalizedDraft]);
  const autosaveKey = draftStorageKey(analysis, allMatches);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(autosaveKey);
        setStoredDraft(raw ? (JSON.parse(raw) as MatchAnalysisRecord) : null);
      } catch {
        setStoredDraft(null);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [autosaveKey]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => (startOnOdds ? firstOddsRef.current : firstInputRef.current)?.focus(), 120);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, startOnOdds]);

  useEffect(() => {
    if (autosaveState !== "dirty") return;
    const timer = window.setTimeout(() => {
      setAutosaveState("saving");
      try {
        window.localStorage.setItem(autosaveKey, JSON.stringify(draft));
        window.setTimeout(() => setAutosaveState("saved"), 250);
      } catch {
        setAutosaveState("dirty");
      }
    }, 25000);
    return () => window.clearTimeout(timer);
  }, [autosaveKey, autosaveState, draft]);

  useEffect(() => {
    function preserveDraftOnSessionExpiry() {
      try {
        window.localStorage.setItem(autosaveKey, JSON.stringify(draft));
      } catch {
        // Brak storage nie może blokować ponownego logowania.
      }
    }

    window.addEventListener(studioSessionExpiredEvent, preserveDraftOnSessionExpiry);
    return () => {
      window.removeEventListener(studioSessionExpiredEvent, preserveDraftOnSessionExpiry);
    };
  }, [autosaveKey, draft]);

  function change(updater: (current: MatchAnalysisRecord) => MatchAnalysisRecord) {
    setDraft((current) => {
      const next = updater(current);
      return current.sourceMode === "api" ? { ...next, sourceMode: "mixed" } : next;
    });
    setAutosaveState("dirty");
    setValidationMessage("");
  }

  function updateBasic<K extends keyof MatchAnalysisRecord["basic"]>(key: K, value: MatchAnalysisRecord["basic"][K]) {
    setManualOverrides((current) => new Set(current).add(`basic.${String(key)}`));
    change((current) => ({ ...current, basic: { ...current.basic, [key]: value } }));
  }

  function updateStats(team: "home" | "away", key: keyof TeamManualStats, value: string) {
    setManualOverrides((current) => new Set(current).add(`${team}.${String(key)}`));
    change((current) => ({
      ...current,
      manualStats: {
        ...current.manualStats,
        [team]: { ...current.manualStats[team], [key]: key === "formLast5" ? value : safeNumber(value) },
      },
    }));
  }

  function sourceFor(key: string, value: unknown) {
    if (value === null || value === undefined || value === "") return "missing" as const;
    if (manualOverrides.has(key)) return "mixed" as const;
    if (draft.dataSource) return "api" as const;
    return "manual" as const;
  }

  function updateOdds(key: MarketKey, value: string) {
    change((current) => ({ ...current, odds: { ...current.odds, [key]: safeNumber(value) } }));
  }

  function updateProbability(key: MarketKey, value: string) {
    change((current) => ({ ...current, userProbabilities: { ...current.userProbabilities, [key]: safeNumber(value) } }));
  }

  function updateNote(key: keyof MatchAnalysisRecord["notes"], value: string) {
    change((current) => ({ ...current, notes: { ...current.notes, [key]: value } }));
  }

  function updatePremium(key: keyof MatchAnalysisRecord["premiumSections"], value: string) {
    change((current) => ({ ...current, premiumSections: { ...current.premiumSections, [key]: value } }));
  }

  function hasRequiredData() {
    return Boolean(draft.basic.league.trim() && draft.basic.homeTeam.trim() && draft.basic.awayTeam.trim() && draft.basic.kickoff);
  }

  function containsEnteredData() {
    return [draft.basic.league, draft.basic.country, draft.basic.homeTeam, draft.basic.awayTeam, draft.basic.kickoff, draft.basic.venue, draft.basic.fotmobUrl].some((value) => value.trim())
      || Object.values(draft.manualStats.home).some((value) => value !== null && value !== "")
      || Object.values(draft.manualStats.away).some((value) => value !== null && value !== "");
  }

  function applyImport(imported: FootballMatchImport) {
    setDraft((current) => applyFootballImportToAnalysis(current, imported));
    setAutosaveState("dirty");
    setValidationMessage("");
    setImportOpen(false);
    setPendingImport(null);
    setManualOverrides(new Set());
    setOverwriteApproved(false);
    onModeChange("full");
    setActiveTab("odds");
    window.setTimeout(() => firstOddsRef.current?.focus(), 120);
    onNotify("Dane zostały pobrane. Uzupełnij aktualne kursy i sprawdź wartości przed zapisaniem.");
  }

  function handleImport(imported: FootballMatchImport) {
    if (containsEnteredData() && !overwriteApproved) {
      setPendingImport(imported);
      setImportOpen(false);
      return;
    }
    applyImport(imported);
  }

  function requestImport() {
    if (containsEnteredData()) {
      setConfirmReimport(true);
      return;
    }
    setImportOpen(true);
  }

  function hasStatsForBothTeams() {
    return (["home", "away"] as const).every((team) =>
      statFields.some((field) => field.key !== "formLast5" && safeNumber(draft.manualStats[team][field.key]) !== null),
    );
  }

  async function save(status: PublicationStatus, confirmed = false) {
    if (!hasRequiredData()) {
      setActiveTab("match");
      setValidationMessage("Uzupełnij wymagane dane meczu: ligę, gospodarza, gościa oraz datę i godzinę.");
      onNotify("Uzupełnij wymagane dane meczu.");
      return;
    }
    if (status === "published" && (metrics.dataCompleteness.percent < 50 || !hasStatsForBothTeams()) && !confirmed) {
      setConfirmPublish(true);
      return;
    }
    setSaving(true);
    setValidationMessage("");
    try {
      const saved = await onSave({ ...normalizedDraft, publicationStatus: status }, status);
      window.localStorage.removeItem(autosaveKey);
      setDraft(saved);
      setAutosaveState("saved");
      setStoredDraft(null);
      setConfirmPublish(false);
    } catch {
      try {
        window.localStorage.setItem(autosaveKey, JSON.stringify(draft));
        setAutosaveState("saved");
      } catch {
        setAutosaveState("dirty");
      }
      setValidationMessage("Nie udało się zapisać zmian. Spróbuj ponownie.");
    } finally {
      setSaving(false);
    }
  }

  function restoreDraft() {
    if (!storedDraft) return;
    setDraft(normalizeAnalysis(storedDraft, allMatches));
    setStoredDraft(null);
    setAutosaveState("dirty");
  }

  function discardDraft() {
    window.localStorage.removeItem(autosaveKey);
    setStoredDraft(null);
  }

  const firstMissingOddsKey = marketDefinitions.find((market) => draft.odds[market.key] === null)?.key
    || marketDefinitions[0].key;
  const oddsFields = (
    <>
      {marketDefinitions.map((market) => (
        <Field key={market.key} label={market.label}>
          <input ref={market.key === firstMissingOddsKey ? firstOddsRef : undefined} className="admin-input" type="number" min="0" step="0.01" value={inputValue(draft.odds[market.key])} onChange={(event) => updateOdds(market.key, event.target.value)} />
        </Field>
      ))}
    </>
  );

  const notesFields = [
    ["summary", "Podsumowanie ręczne"],
    ["homeStrengths", "Mocne strony gospodarzy"],
    ["awayStrengths", "Mocne strony gości"],
    ["keyRisks", "Ryzyka"],
    ["scenarios", "Scenariusze"],
    ["workNotes", "Notatki robocze"],
    ["finalAssessment", "Ocena końcowa"],
    ["h2hNotes", "H2H"],
    ["generalStatsNotes", "Notatki statystyczne"],
  ] as const;

  return (
    <div className="analysis-form-backdrop" role="dialog" aria-modal="true" aria-label="Edytor analizy">
      <div className="analysis-form-drawer">
        <header className="analysis-form-header">
          <div className="flex min-w-0 items-center gap-4">
            <Logo href="" />
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs text-slate-400">Slot {String(draft.slotNumber).padStart(2, "0")}</p>
              <p className="truncate font-black text-white">{draft.basic.homeTeam || "Gospodarz"} vs {draft.basic.awayTeam || "Gość"}</p>
            </div>
          </div>
          <div className="editor-mode-switch" aria-label="Tryb edycji">
            <button type="button" className={mode === "quick" ? "active" : ""} onClick={() => onModeChange("quick")}>Szybka analiza</button>
            <button type="button" className={mode === "full" ? "active" : ""} onClick={() => onModeChange("full")}>Pełna analiza</button>
          </div>
          <button type="button" className="analysis-form-close" onClick={onClose} aria-label="Zamknij formularz">×</button>
        </header>

        {storedDraft && (
          <div className="draft-restore-banner">
            <p><strong>Wykryto niezapisaną kopię roboczą.</strong> Czy chcesz ją przywrócić?</p>
            <div className="flex gap-2">
              <button type="button" className="btn-primary" onClick={restoreDraft}>Przywróć</button>
              <button type="button" className="btn-secondary" onClick={discardDraft}>Odrzuć</button>
            </div>
          </div>
        )}

        <div className="analysis-form-layout">
          <form className="analysis-form-scroll" onSubmit={(event) => { event.preventDefault(); void save("draft"); }}>
            <div className="analysis-form-intro">
              <div>
                <p className="eyebrow">{mode === "quick" ? "Szybka analiza" : "Pełna analiza"}</p>
                <h1 className="mt-2 text-2xl font-black text-white">{mode === "quick" ? "Najważniejsze dane w jednym miejscu" : "Pełna kontrola raportu"}</h1>
                <span className={`source-mode-badge source-${draft.sourceMode}`}>{draft.sourceMode === "api" ? "Pobrane z API" : draft.sourceMode === "mixed" ? "Zmienione ręcznie" : "Dane ręczne"}</span>
              </div>
              <div className="flex flex-col items-end gap-2"><button type="button" className="btn-secondary" onClick={requestImport}>Pobierz dane meczu</button><DraftAutosaveStatus state={autosaveState} /></div>
            </div>

            {mode === "full" && (
              <nav className="analysis-tabs" aria-label="Sekcje formularza">
                {tabs.map(([value, label]) => (
                  <button key={value} type="button" className={activeTab === value ? "active" : ""} onClick={() => setActiveTab(value)}>{label}</button>
                ))}
              </nav>
            )}

            <div className="space-y-5">
              {mode === "quick" ? (
                <>
                  <Section title="Dane meczu"><RequiredMatchFields draft={draft} updateBasic={updateBasic} firstInputRef={firstInputRef} sourceFor={sourceFor} /></Section>
                  <Section title="Kursy">{oddsFields}</Section>
                  <Section title="Ostatnie 5 meczów — gospodarze"><TeamFields team="home" fields={quickStatFields} draft={draft} onChange={updateStats} sourceFor={sourceFor} /></Section>
                  <Section title="Ostatnie 5 meczów — goście"><TeamFields team="away" fields={quickStatFields} draft={draft} onChange={updateStats} sourceFor={sourceFor} /></Section>
                  <Section title="Opcjonalnie">
                    <div className="sm:col-span-2"><Field label="Składy i absencje"><textarea className="admin-textarea" value={draft.notes.lineupsNotes} onChange={(event) => updateNote("lineupsNotes", event.target.value)} /></Field></div>
                    <div className="sm:col-span-2"><Field label="Krótka notatka robocza"><textarea className="admin-textarea" value={draft.notes.workNotes} onChange={(event) => updateNote("workNotes", event.target.value)} /></Field></div>
                  </Section>
                </>
              ) : (
                <>
                  {activeTab === "match" && <Section title="Dane meczu"><RequiredMatchFields draft={draft} updateBasic={updateBasic} firstInputRef={firstInputRef} sourceFor={sourceFor} /></Section>}
                  {activeTab === "home" && <Section title="Statystyki gospodarzy — ostatnie 5 meczów"><TeamFields team="home" fields={statFields} draft={draft} onChange={updateStats} sourceFor={sourceFor} /></Section>}
                  {activeTab === "away" && <Section title="Statystyki gości — ostatnie 5 meczów"><TeamFields team="away" fields={statFields} draft={draft} onChange={updateStats} sourceFor={sourceFor} /></Section>}
                  {activeTab === "odds" && <Section title="Kursy">{oddsFields}</Section>}
                  {activeTab === "model" && (
                    <Section title="Obliczenia modelu" description="Wyniki bazują na czystych danych. Ręczne wartości są opcjonalne.">
                      <Field label="Poziom ryzyka"><select className="admin-input" value={draft.settings.riskLevel} onChange={(event) => change((current) => ({ ...current, settings: { ...current.settings, riskLevel: event.target.value as RiskLevel } }))}><option value="auto">Automatyczny</option><option value="low">Niski</option><option value="medium">Średni</option><option value="high">Wysoki</option></select></Field>
                      <div className="sm:col-span-2">
                        <details className="advanced-adjustments">
                          <summary>Zaawansowane korekty modelu</summary>
                          <p>Zostaw pola puste, aby użyć automatycznych wyliczeń.</p>
                          <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <Field label="Pewność analizy — opcjonalnie 1–100"><input className="admin-input" type="number" min="1" max="100" value={inputValue(draft.settings.confidence)} onChange={(event) => change((current) => ({ ...current, settings: { ...current.settings, confidence: safeNumber(event.target.value) } }))} /></Field>
                            <Field label="Ręczna notatka ryzyka"><textarea className="admin-textarea" value={draft.settings.riskNote} onChange={(event) => change((current) => ({ ...current, settings: { ...current.settings, riskNote: event.target.value } }))} /></Field>
                            {marketDefinitions.map((market) => <Field key={market.key} label={`Prawdopodobieństwo ${market.label} (%)`}><input className="admin-input" type="number" min="0" max="100" step="0.1" value={inputValue(draft.userProbabilities[market.key])} onChange={(event) => updateProbability(market.key, event.target.value)} /></Field>)}
                          </div>
                        </details>
                      </div>
                    </Section>
                  )}
                  {activeTab === "lineups" && <Section title="Składy i absencje"><div className="sm:col-span-2"><Field label="Składy"><textarea className="admin-textarea" value={draft.notes.lineupsNotes} onChange={(event) => updateNote("lineupsNotes", event.target.value)} /></Field></div><div className="sm:col-span-2"><Field label="Kontuzje i absencje"><textarea className="admin-textarea" value={draft.notes.injuriesNotes} onChange={(event) => updateNote("injuriesNotes", event.target.value)} /></Field></div></Section>}
                  {activeTab === "notes" && <Section title="Notatki — wszystkie opcjonalne" description="Jeśli pozostawisz je puste, raport utworzy naturalne teksty automatycznie.">{notesFields.map(([key, label]) => <div key={key} className="sm:col-span-2"><Field label={label}><textarea className="admin-textarea" value={draft.notes[key]} onChange={(event) => updateNote(key, event.target.value)} /></Field></div>)}</Section>}
                  {activeTab === "premium" && <Section title="Sekcje Premium">{([ ["cornersAnalysis", "Rzuty rożne"], ["cardsAnalysis", "Kartki"], ["shotsAnalysis", "Strzały"], ["halvesAnalysis", "Połowy"], ["advancedRisk", "Zaawansowane ryzyko"], ["h2hAdvanced", "Zaawansowane H2H"], ["lineupsAdvanced", "Zaawansowane składy"] ] as const).map(([key, label]) => <div key={key} className="sm:col-span-2"><Field label={label}><textarea className="admin-textarea" value={draft.premiumSections[key]} onChange={(event) => updatePremium(key, event.target.value)} /></Field></div>)}</Section>}
                  {activeTab === "publication" && <Section title="Ustawienia publikacji"><Field label="Dostęp raportu"><select className="admin-input" value={draft.basic.status} onChange={(event) => updateBasic("status", event.target.value as AccessStatus)}><option value="free">Darmowa</option><option value="premium">Premium</option></select></Field><Field label="Poziom danych"><select className="admin-input" value={draft.basic.dataLevel} onChange={(event) => updateBasic("dataLevel", event.target.value as DataLevel)}><option value="basic">Podstawowy</option><option value="advanced">Zaawansowany</option></select></Field><Field label="Status"><select className="admin-input" value={draft.publicationStatus} onChange={(event) => change((current) => ({ ...current, publicationStatus: event.target.value as PublicationStatus }))}><option value="draft">Szkic</option><option value="published">Opublikowana</option><option value="archived">Zarchiwizowana</option></select></Field><Field label="Numer slotu"><input className="admin-input" value={draft.slotNumber} readOnly /></Field></Section>}
                </>
              )}
            </div>

            {validationMessage && <p className="form-validation-message" role="alert">{validationMessage}</p>}
            {confirmPublish && (
              <div className="publish-warning">
                <p><strong>Analiza zawiera mało danych.</strong> Czy na pewno chcesz ją opublikować?</p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row"><button type="button" className="btn-primary" onClick={() => void save("published", true)}>Opublikuj mimo ostrzeżenia</button><button type="button" className="btn-secondary" onClick={() => setConfirmPublish(false)}>Wróć do danych</button></div>
              </div>
            )}

            <footer className="analysis-form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Zamknij</button>
              <button type="submit" className="btn-secondary" disabled={saving}>{saving ? "Zapisywanie…" : "Zapisz jako szkic"}</button>
              <button type="button" className="btn-primary" disabled={saving} onClick={() => void save("published")}>Zapisz i opublikuj</button>
              {mode === "quick" && <button type="button" className="btn-secondary" onClick={() => onModeChange("full")}>Przejdź do pełnej edycji</button>}
            </footer>
          </form>

          <div className="analysis-preview-scroll"><ModelLivePreview analysis={normalizedDraft} /></div>
        </div>
      </div>
      {importOpen && <MatchImportModal onClose={() => setImportOpen(false)} onApply={handleImport} />}
      {confirmReimport && <ConfirmDialog title="Pobrać dane ponownie?" message="Ponowne pobranie może zastąpić ręcznie zmienione wartości. Czy chcesz kontynuować?" confirmLabel="Kontynuuj" onCancel={() => setConfirmReimport(false)} onConfirm={() => { setConfirmReimport(false); setOverwriteApproved(true); setImportOpen(true); }} />}
      {pendingImport && <ConfirmDialog title="Zastąpić dane w formularzu?" message="Formularz zawiera już dane. Import zastąpi dane meczu i statystyki obu drużyn, ale pozostawi wpisane kursy oraz notatki." confirmLabel="Zastąp dane" onCancel={() => setPendingImport(null)} onConfirm={() => applyImport(pendingImport)} />}
    </div>
  );
}
