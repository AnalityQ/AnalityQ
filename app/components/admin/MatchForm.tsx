"use client";

import { useMemo, useState } from "react";
import { marketDefinitions, safeNumber } from "@/lib/calculations";
import { normalizeAnalysis } from "@/lib/storage";
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
import { AdminLivePreview } from "./AdminLivePreview";

const statFields: Array<{ key: keyof TeamManualStats; label: string; type?: "text" | "number" }> = [
  { key: "goalsForLast5", label: "Gole strzelone" },
  { key: "goalsAgainstLast5", label: "Gole stracone" },
  { key: "cornersForLast5", label: "Rożne wykonane" },
  { key: "cornersAgainstLast5", label: "Rożne przeciwko" },
  { key: "cardsForLast5", label: "Kartki" },
  { key: "cardsAgainstLast5", label: "Kartki przeciwników" },
  { key: "shotsForLast5", label: "Strzały" },
  { key: "shotsAgainstLast5", label: "Strzały przeciwko" },
  { key: "xgForLast5", label: "xG" },
  { key: "xgAgainstLast5", label: "xG przeciwko" },
  { key: "formLast5", label: "Forma W/D/L", type: "text" },
];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-form-section">
      <h3 className="text-xl font-black text-white">{title}</h3>
      {description && <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function numericInputValue(value: NumericValue | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function parseNumericInput(value: string): NumericValue {
  return safeNumber(value);
}

export function MatchForm({
  analysis,
  allMatches,
  onCancel,
  onSave,
}: {
  analysis: MatchAnalysisRecord;
  allMatches: MatchAnalysisRecord[];
  onCancel: () => void;
  onSave: (analysis: MatchAnalysisRecord) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState<MatchAnalysisRecord>(() => analysis);
  const normalizedDraft = useMemo(() => normalizeAnalysis(draft, allMatches), [allMatches, draft]);

  function updateDraft(updater: (current: MatchAnalysisRecord) => MatchAnalysisRecord) {
    setDraft((current) => updater(current));
  }

  function updateBasic<K extends keyof MatchAnalysisRecord["basic"]>(
    key: K,
    value: MatchAnalysisRecord["basic"][K],
  ) {
    updateDraft((current) => ({
      ...current,
      basic: {
        ...current.basic,
        [key]: value,
      },
    }));
  }

  function updateStats(team: "home" | "away", key: keyof TeamManualStats, value: string) {
    updateDraft((current) => ({
      ...current,
      manualStats: {
        ...current.manualStats,
        [team]: {
          ...current.manualStats[team],
          [key]: key === "formLast5" ? value : parseNumericInput(value),
        },
      },
    }));
  }

  function updateOdds(key: MarketKey, value: string) {
    updateDraft((current) => ({
      ...current,
      odds: {
        ...current.odds,
        [key]: parseNumericInput(value),
      },
    }));
  }

  function updateUserProbability(key: MarketKey, value: string) {
    updateDraft((current) => ({
      ...current,
      userProbabilities: {
        ...current.userProbabilities,
        [key]: parseNumericInput(value),
      },
    }));
  }

  function updateNote(key: keyof MatchAnalysisRecord["notes"], value: string) {
    updateDraft((current) => ({
      ...current,
      notes: {
        ...current.notes,
        [key]: value,
      },
    }));
  }

  function updatePremium(key: keyof MatchAnalysisRecord["premiumSections"], value: string) {
    updateDraft((current) => ({
      ...current,
      premiumSections: {
        ...current.premiumSections,
        [key]: value,
      },
    }));
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave(normalizedDraft);
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-5 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Pełna analiza</p>
            <h2 className="mt-2 text-3xl font-black text-white">
              Slot {String(draft.slotNumber).padStart(2, "0")}
            </h2>
            <p className="mt-2 text-sm text-slate-400">Slug raportu: {normalizedDraft.slug}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-secondary justify-center" onClick={onCancel}>
              Zamknij
            </button>
            <button type="submit" className="btn-primary justify-center">
              Zapisz analizę
            </button>
          </div>
        </div>

        <FormSection title="A) Status i publikacja">
          <Field label="Status publikacji">
            <select
              className="admin-input"
              value={draft.publicationStatus}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  publicationStatus: event.target.value as PublicationStatus,
                }))
              }
            >
              <option value="draft">Szkic</option>
              <option value="published">Opublikowana</option>
              <option value="archived">Zarchiwizowana</option>
            </select>
          </Field>
          <Field label="Dostęp raportu">
            <select
              className="admin-input"
              value={draft.basic.status}
              onChange={(event) => updateBasic("status", event.target.value as AccessStatus)}
            >
              <option value="free">Darmowa</option>
              <option value="premium">Premium</option>
            </select>
          </Field>
          <Field label="Poziom danych">
            <select
              className="admin-input"
              value={draft.basic.dataLevel}
              onChange={(event) => updateBasic("dataLevel", event.target.value as DataLevel)}
            >
              <option value="basic">Podstawowy</option>
              <option value="advanced">Zaawansowany</option>
            </select>
          </Field>
          <Field label="Numer slotu">
            <input className="admin-input" value={draft.slotNumber} readOnly />
          </Field>
        </FormSection>

        <FormSection title="B) Dane meczu">
          <Field label="Liga">
            <input className="admin-input" value={draft.basic.league} onChange={(event) => updateBasic("league", event.target.value)} />
          </Field>
          <Field label="Kraj">
            <input className="admin-input" value={draft.basic.country} onChange={(event) => updateBasic("country", event.target.value)} />
          </Field>
          <Field label="Gospodarz">
            <input className="admin-input" value={draft.basic.homeTeam} onChange={(event) => updateBasic("homeTeam", event.target.value)} />
          </Field>
          <Field label="Gość">
            <input className="admin-input" value={draft.basic.awayTeam} onChange={(event) => updateBasic("awayTeam", event.target.value)} />
          </Field>
          <Field label="Data i godzina">
            <input
              className="admin-input"
              type="datetime-local"
              value={draft.basic.kickoff}
              onChange={(event) => updateBasic("kickoff", event.target.value)}
            />
          </Field>
          <Field label="Link do źródła danych">
            <input className="admin-input" value={draft.basic.fotmobUrl} onChange={(event) => updateBasic("fotmobUrl", event.target.value)} />
          </Field>
          <Field label="Stadion / miejsce meczu">
            <input className="admin-input" value={draft.basic.venue} onChange={(event) => updateBasic("venue", event.target.value)} />
          </Field>
        </FormSection>

        {(["home", "away"] as const).map((team) => (
          <FormSection
            key={team}
            title={
              team === "home"
                ? "C) Statystyki gospodarzy z ostatnich 5 meczów"
                : "D) Statystyki gości z ostatnich 5 meczów"
            }
          >
            {statFields.map((field) => (
              <Field key={`${team}-${field.key}`} label={field.label}>
                <input
                  className="admin-input"
                  type={field.type === "text" ? "text" : "number"}
                  step="0.01"
                  value={
                    field.key === "formLast5"
                      ? String(draft.manualStats[team][field.key] || "")
                      : numericInputValue(draft.manualStats[team][field.key] as NumericValue)
                  }
                  onChange={(event) => updateStats(team, field.key, event.target.value)}
                  placeholder={field.key === "formLast5" ? "np. W,W,D,L,W" : ""}
                />
              </Field>
            ))}
          </FormSection>
        ))}

        <FormSection title="E) Kursy — wpisywane ręcznie">
          {marketDefinitions.map((market) => (
            <Field key={market.key} label={market.label}>
              <input
                className="admin-input"
                type="number"
                step="0.01"
                value={numericInputValue(draft.odds[market.key])}
                onChange={(event) => updateOdds(market.key, event.target.value)}
              />
            </Field>
          ))}
        </FormSection>

        <FormSection
          title="F) Poziom ryzyka i pewność analizy"
          description="Pewność analizy ocenia jakość i kompletność danych, a nie gwarancję wyniku."
        >
          <Field label="Poziom ryzyka">
            <select
              className="admin-input"
              value={draft.settings.riskLevel}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  settings: { ...current.settings, riskLevel: event.target.value as RiskLevel },
                }))
              }
            >
              <option value="auto">Automatyczny</option>
              <option value="low">Niski</option>
              <option value="medium">Średni</option>
              <option value="high">Wysoki</option>
            </select>
          </Field>
          <Field label="Pewność analizy — opcjonalnie 1-100">
            <input
              className="admin-input"
              type="number"
              min="1"
              max="100"
              value={numericInputValue(draft.settings.confidence)}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  settings: { ...current.settings, confidence: parseNumericInput(event.target.value) },
                }))
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notatka ryzyka">
              <textarea
                className="admin-textarea"
                value={draft.settings.riskNote}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    settings: { ...current.settings, riskNote: event.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </FormSection>

        <details className="admin-form-section group">
          <summary className="cursor-pointer list-none">
            <span className="text-xl font-black text-white">Zaawansowane korekty modelu</span>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Zostaw puste, jeśli chcesz użyć wyliczeń modelu. Wpisz własną wartość tylko wtedy,
              gdy świadomie chcesz skorygować model.
            </p>
          </summary>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {marketDefinitions.map((market) => (
              <Field key={market.key} label={market.label}>
                <input
                  className="admin-input"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={numericInputValue(draft.userProbabilities[market.key])}
                  onChange={(event) => updateUserProbability(market.key, event.target.value)}
                />
              </Field>
            ))}
          </div>
        </details>

        <FormSection title="G) Notatki analityczne">
          {[
            ["summary", "Podsumowanie ręczne"],
            ["homeStrengths", "Mocne strony gospodarzy"],
            ["awayStrengths", "Mocne strony gości"],
            ["keyRisks", "Ryzyka"],
            ["scenarios", "Scenariusze"],
            ["workNotes", "Notatki robocze"],
            ["finalAssessment", "Ocena końcowa"],
            ["h2hNotes", "H2H"],
            ["lineupsNotes", "Składy / absencje"],
            ["injuriesNotes", "Kontuzje / absencje"],
            ["generalStatsNotes", "Notatki statystyczne"],
          ].map(([key, label]) => (
            <div key={key} className="sm:col-span-2">
              <Field label={label}>
                <textarea
                  className="admin-textarea"
                  value={draft.notes[key as keyof MatchAnalysisRecord["notes"]]}
                  onChange={(event) => updateNote(key as keyof MatchAnalysisRecord["notes"], event.target.value)}
                />
              </Field>
            </div>
          ))}
        </FormSection>

        <FormSection title="H) Sekcje premium">
          {[
            ["cornersAnalysis", "Rzuty rożne"],
            ["cardsAnalysis", "Kartki"],
            ["shotsAnalysis", "Strzały"],
            ["halvesAnalysis", "Połowy"],
            ["advancedRisk", "Zaawansowane ryzyko"],
            ["h2hAdvanced", "Zaawansowane H2H"],
            ["lineupsAdvanced", "Zaawansowane składy"],
          ].map(([key, label]) => (
            <div key={key} className="sm:col-span-2">
              <Field label={label}>
                <textarea
                  className="admin-textarea"
                  value={draft.premiumSections[key as keyof MatchAnalysisRecord["premiumSections"]]}
                  onChange={(event) =>
                    updatePremium(key as keyof MatchAnalysisRecord["premiumSections"], event.target.value)
                  }
                />
              </Field>
            </div>
          ))}
        </FormSection>
      </div>

      <AdminLivePreview analysis={normalizedDraft} />
    </form>
  );
}
