"use client";

import { useEffect, useState } from "react";
import { getStudioDatabaseErrorMessage, importAnalysesToDatabase } from "@/lib/database";
import { getMatches, resetAllMatches } from "@/lib/storage";
import type { MatchAnalysisRecord } from "@/lib/types";

export function LocalMigrationPanel({ onChange }: { onChange: () => void | Promise<void> }) {
  const [localMatches, setLocalMatches] = useState<MatchAnalysisRecord[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function refreshLocal() {
    setLocalMatches(getMatches());
  }

  useEffect(() => {
    const timer = window.setTimeout(refreshLocal, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function migrate() {
    if (localMatches.length === 0) return;
    setBusy(true);
    setMessage("");

    try {
      await importAnalysesToDatabase(localMatches);
      setMessage("Analizy zostały przeniesione do bazy online.");
      await onChange();
    } catch (error) {
      setMessage(getStudioDatabaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  function clearLocalCopies() {
    resetAllMatches();
    refreshLocal();
    setMessage("Lokalne kopie zostały wyczyszczone.");
  }

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="eyebrow">Migracja danych lokalnych</p>
          <h2 className="mt-2 text-2xl font-black text-white">Przeniesienie do Supabase</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {localMatches.length > 0
              ? "Wykryto lokalne analizy zapisane w tej przeglądarce. Możesz przenieść je do bazy online."
              : "Brak lokalnych analiz do migracji."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="btn-primary justify-center"
            onClick={migrate}
            disabled={busy || localMatches.length === 0}
          >
            {busy ? "Przenoszenie..." : "Przenieś do Supabase"}
          </button>
          <button
            type="button"
            className="btn-secondary justify-center"
            onClick={clearLocalCopies}
            disabled={busy || localMatches.length === 0}
          >
            Wyczyść lokalne kopie
          </button>
        </div>
      </div>

      {localMatches.length > 0 && (
        <p className="mt-4 text-sm text-slate-400">Lokalne rekordy do migracji: {localMatches.length}</p>
      )}
      {message && <p className="mt-4 text-sm font-bold text-cyan-100">{message}</p>}
    </section>
  );
}
