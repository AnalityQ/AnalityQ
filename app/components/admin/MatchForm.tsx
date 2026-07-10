"use client";

import { useMemo, useState } from "react";
import { marketDefinitions } from "@/lib/calculations";
import { normalizeAnalysis } from "@/lib/storage";
import type {
  AccessStatus,
  DataLevel,
  MarketKey,
  MatchAnalysisRecord,
  PublicationStatus,
  RiskLevel,
  TeamManualStats,
} from "@/lib/types";
import { AdminLivePreview } from "./AdminLivePreview";

const statFields: Array<{ key: keyof TeamManualStats; label: string; type?: "text" | "number" }> = [
  { key: "goalsForLast5", label: "gole strzelone" },
  { key: "goalsAgainstLast5", label: "gole stracone" },
  { key: "cornersForLast5", label: "rożne wykonane" },
  { key: "cornersAgainstLast5", label: "rożne przeciwników" },
  { key: "cardsForLast5", label: "kartki własne" },
  { key: "cardsAgainstLast5", label: "kartki przeciwników" },
  { key: "shotsForLast5", label: "strzały" },
  { key: "shotsAgainstLast5", label: "strzały przeciwników" },
  { key: "xgForLast5", label: "xG" },
  { key: "xgAgainstLast5", label: "xG przeciwko" },
  { key: "formLast5", label: "forma W,D,L", type: "text" },
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

export function MatchForm({
  analysis,
  allMatches,
  onCancel,
  onSave,
}: {
  analysis: MatchAnalysisRecord;
  allMatches: MatchAnalysisRecord[];
  onCancel: () => void;
  onSave: (analysis: MatchAnalysisRecord) => void;
}) {
  const [draft, setDraft] = useState<MatchAnalysisRecord>(() => analysis);
  const normalizedDraft = useMemo(() => normalizeAnalysis(draft, allMatches), [allMatches, draft]);

  function updateDraft(updater: (current: MatchAnalysisRecord) => MatchAnalysisRecord) {
    setDraft((current) => updater(current));
  }

  function numberValue(value: string) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function updateBasic(key: keyof MatchAnalysisRecord["basic"], value: string) {
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
          [key]: key === "formLast5" ? value : numberValue(value),
        },
      },
    }));
  }

  function updateOdds(key: MarketKey, value: string) {
    updateDraft((current) => ({
      ...current,
      odds: {
        ...current.odds,
        [key]: numberValue(value),
      },
    }));
  }

  function updateUserProbability(key: MarketKey, value: string) {
    updateDraft((current) => ({
      ...current,
      userProbabilities: {
        ...current.userProbabilities,
        [key]: numberValue(value),
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
    onSave(normalizedDraft);
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-5 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Formularz analizy</p>
            <h2 className="mt-2 text-3xl font-black text-white">
              Slot {String(draft.slotNumber).padStart(2, "0")}
            </h2>
            <p className="mt-2 text-sm text-slate-400">Slug: {normalizedDraft.slug}</p>
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
          <Field label="publicationStatus">
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
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <Field label="status">
            <select
              className="admin-input"
              value={draft.basic.status}
              onChange={(event) => updateBasic("status", event.target.value as AccessStatus)}
            >
              <option value="free">free</option>
              <option value="premium">premium</option>
            </select>
          </Field>
          <Field label="dataLevel">
            <select
              className="admin-input"
              value={draft.basic.dataLevel}
              onChange={(event) => updateBasic("dataLevel", event.target.value as DataLevel)}
            >
              <option value="basic">basic</option>
              <option value="advanced">advanced</option>
            </select>
          </Field>
          <Field label="slotNumber">
            <input className="admin-input" value={draft.slotNumber} readOnly />
          </Field>
        </FormSection>

        <FormSection title="B) Dane meczu">
          <Field label="liga">
            <input className="admin-input" value={draft.basic.league} onChange={(event) => updateBasic("league", event.target.value)} />
          </Field>
          <Field label="kraj">
            <input className="admin-input" value={draft.basic.country} onChange={(event) => updateBasic("country", event.target.value)} />
          </Field>
          <Field label="gospodarz">
            <input className="admin-input" value={draft.basic.homeTeam} onChange={(event) => updateBasic("homeTeam", event.target.value)} />
          </Field>
          <Field label="gość">
            <input className="admin-input" value={draft.basic.awayTeam} onChange={(event) => updateBasic("awayTeam", event.target.value)} />
          </Field>
          <Field label="data/godzina">
            <input
              className="admin-input"
              type="datetime-local"
              value={draft.basic.kickoff}
              onChange={(event) => updateBasic("kickoff", event.target.value)}
            />
          </Field>
          <Field label="link FotMob">
            <input className="admin-input" value={draft.basic.fotmobUrl} onChange={(event) => updateBasic("fotmobUrl", event.target.value)} />
          </Field>
          <Field label="venue">
            <input className="admin-input" value={draft.basic.venue} onChange={(event) => updateBasic("venue", event.target.value)} />
          </Field>
        </FormSection>

        {(["home", "away"] as const).map((team) => (
          <FormSection
            key={team}
            title={
              team === "home"
                ? "C) Dane liczbowe z FotMob — gospodarze, ostatnie 5 meczów"
                : "D) Dane liczbowe z FotMob — goście, ostatnie 5 meczów"
            }
          >
            {statFields.map((field) => (
              <Field key={`${team}-${field.key}`} label={field.label}>
                <input
                  className="admin-input"
                  type={field.type === "text" ? "text" : "number"}
                  step="0.01"
                  value={draft.manualStats[team][field.key]}
                  onChange={(event) => updateStats(team, field.key, event.target.value)}
                  placeholder={field.key === "formLast5" ? "W,W,D,L,W" : "0"}
                />
              </Field>
            ))}
          </FormSection>
        ))}

        <FormSection title="E) Kursy — wpisywane ręcznie z Fortuny">
          {marketDefinitions.map((market) => (
            <Field key={market.key} label={market.label}>
              <input
                className="admin-input"
                type="number"
                step="0.01"
                value={draft.odds[market.key]}
                onChange={(event) => updateOdds(market.key, event.target.value)}
              />
            </Field>
          ))}
        </FormSection>

        <FormSection
          title="F) Moja ocena %"
          description="Jeśli zostawisz puste, AnalityQ użyje modelowego prawdopodobieństwa. Jeśli wpiszesz własną ocenę, zostanie użyta do obliczenia edge."
        >
          {marketDefinitions.map((market) => (
            <Field key={market.key} label={market.label}>
              <input
                className="admin-input"
                type="number"
                step="0.1"
                value={draft.userProbabilities[market.key] ?? ""}
                onChange={(event) => updateUserProbability(market.key, event.target.value)}
                placeholder="opcjonalnie"
              />
            </Field>
          ))}
        </FormSection>

        <FormSection title="G) Ryzyko i confidence">
          <Field label="riskLevel">
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
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </Field>
          <Field label="confidence opcjonalnie 1–100">
            <input
              className="admin-input"
              type="number"
              min="0"
              max="100"
              value={draft.settings.confidence}
              onChange={(event) =>
                updateDraft((current) => ({
                  ...current,
                  settings: { ...current.settings, confidence: numberValue(event.target.value) },
                }))
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="notatka ryzyka">
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

        <FormSection title="H) Notatki analityczne">
          {[
            ["summary", "summary"],
            ["homeStrengths", "mocne strony gospodarzy"],
            ["awayStrengths", "mocne strony gości"],
            ["keyRisks", "ryzyka"],
            ["scenarios", "scenariusze"],
            ["workNotes", "notatki robocze z FotMob/Fortuny"],
            ["finalAssessment", "ocena końcowa"],
            ["h2hNotes", "H2H"],
            ["lineupsNotes", "składy / absencje"],
            ["injuriesNotes", "kontuzje / absencje"],
            ["generalStatsNotes", "general stats notes"],
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

        <FormSection title="I) Sekcje premium">
          {[
            ["cornersAnalysis", "rożne"],
            ["cardsAnalysis", "kartki"],
            ["shotsAnalysis", "strzały"],
            ["halvesAnalysis", "połowy"],
            ["advancedRisk", "advanced risk"],
            ["h2hAdvanced", "H2H advanced"],
            ["lineupsAdvanced", "składy advanced"],
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
