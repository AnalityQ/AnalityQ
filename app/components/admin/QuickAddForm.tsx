"use client";

import { useMemo, useState } from "react";
import { marketDefinitions, safeNumber } from "@/lib/calculations";
import { normalizeAnalysis } from "@/lib/storage";
import type { MarketKey, MatchAnalysisRecord, NumericValue, TeamManualStats } from "@/lib/types";
import { AdminLivePreview } from "./AdminLivePreview";

const quickMarkets: MarketKey[] = [
  "homeWin",
  "draw",
  "awayWin",
  "over25",
  "under25",
  "bttsYes",
  "bttsNo",
  "cornersOver85",
  "cardsOver35",
];

const quickStats: Array<{ key: keyof TeamManualStats; label: string; type?: "text" | "number" }> = [
  { key: "goalsForLast5", label: "Gole strzelone" },
  { key: "goalsAgainstLast5", label: "Gole stracone" },
  { key: "cornersForLast5", label: "Rożne wykonane" },
  { key: "cornersAgainstLast5", label: "Rożne przeciwko" },
  { key: "cardsForLast5", label: "Kartki" },
  { key: "shotsForLast5", label: "Strzały" },
  { key: "shotsAgainstLast5", label: "Strzały przeciwko" },
  { key: "xgForLast5", label: "xG" },
  { key: "xgAgainstLast5", label: "xG przeciwko" },
  { key: "formLast5", label: "Forma W/D/L", type: "text" },
];

function numericInputValue(value: NumericValue | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-300">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function QuickSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-form-section">
      <h3 className="text-xl font-black text-white">{title}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function QuickAddForm({
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
  const [draft, setDraft] = useState<MatchAnalysisRecord>(() => ({
    ...analysis,
    publicationStatus: "draft",
    settings: { ...analysis.settings, riskLevel: "auto", confidence: null },
  }));
  const normalizedDraft = useMemo(() => normalizeAnalysis(draft, allMatches), [allMatches, draft]);

  function updateDraft(updater: (current: MatchAnalysisRecord) => MatchAnalysisRecord) {
    setDraft((current) => updater(current));
  }

  function updateBasic<K extends keyof MatchAnalysisRecord["basic"]>(
    key: K,
    value: MatchAnalysisRecord["basic"][K],
  ) {
    updateDraft((current) => ({ ...current, basic: { ...current.basic, [key]: value } }));
  }

  function updateOdds(key: MarketKey, value: string) {
    updateDraft((current) => ({
      ...current,
      odds: { ...current.odds, [key]: safeNumber(value) },
    }));
  }

  function updateStats(team: "home" | "away", key: keyof TeamManualStats, value: string) {
    updateDraft((current) => ({
      ...current,
      manualStats: {
        ...current.manualStats,
        [team]: {
          ...current.manualStats[team],
          [key]: key === "formLast5" ? value : safeNumber(value),
        },
      },
    }));
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onSave({ ...normalizedDraft, publicationStatus: "draft" });
  }

  return (
    <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-cyan-200/15 bg-cyan-200/[0.05] p-5 md:flex-row md:items-center">
          <div>
            <p className="eyebrow">Szybkie dodawanie</p>
            <h2 className="mt-2 text-3xl font-black text-white">
              Slot {String(draft.slotNumber).padStart(2, "0")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Zapisuje analizę jako Szkic. Pełne opisy i metryki zostaną wygenerowane z danych wejściowych.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="button" className="btn-secondary justify-center" onClick={onCancel}>
              Zamknij
            </button>
            <button type="submit" className="btn-primary justify-center">
              Zapisz szkic
            </button>
          </div>
        </div>

        <QuickSection title="A) Dane meczu">
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
          <Field label="Stadion / miejsce meczu">
            <input className="admin-input" value={draft.basic.venue} onChange={(event) => updateBasic("venue", event.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Link do źródła danych">
              <input className="admin-input" value={draft.basic.fotmobUrl} onChange={(event) => updateBasic("fotmobUrl", event.target.value)} />
            </Field>
          </div>
        </QuickSection>

        <QuickSection title="B) Kursy">
          {marketDefinitions
            .filter((market) => quickMarkets.includes(market.key))
            .map((market) => (
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
        </QuickSection>

        {(["home", "away"] as const).map((team) => (
          <QuickSection
            key={team}
            title={
              team === "home"
                ? "C) Statystyki gospodarzy z ostatnich 5 meczów"
                : "D) Statystyki gości z ostatnich 5 meczów"
            }
          >
            {quickStats.map((field) => (
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
          </QuickSection>
        ))}

        <QuickSection title="E) Opcjonalnie">
          <div className="sm:col-span-2">
            <Field label="Składy / absencje">
              <textarea
                className="admin-textarea"
                value={draft.notes.lineupsNotes}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    notes: { ...current.notes, lineupsNotes: event.target.value },
                  }))
                }
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Krótka notatka robocza">
              <textarea
                className="admin-textarea"
                value={draft.notes.workNotes}
                onChange={(event) =>
                  updateDraft((current) => ({
                    ...current,
                    notes: { ...current.notes, workNotes: event.target.value },
                  }))
                }
              />
            </Field>
          </div>
        </QuickSection>
      </div>

      <AdminLivePreview analysis={normalizedDraft} />
    </form>
  );
}
