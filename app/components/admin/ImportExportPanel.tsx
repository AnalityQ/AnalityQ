"use client";

import { useRef, useState } from "react";
import {
  exportAnalysesFromDatabase,
  getStudioDatabaseErrorMessage,
  importAnalysesToDatabase,
} from "@/lib/database";

export function ImportExportPanel({ onChange }: { onChange: () => void | Promise<void> }) {
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function exportJson() {
    setBusy(true);
    setMessage("");

    try {
      const data = await exportAnalysesFromDatabase();
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `analityq-kopia-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Kopia JSON została przygotowana z bazy online.");
    } catch (error) {
      setMessage(getStudioDatabaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function importJson(source: string) {
    if (!source.trim()) {
      setMessage("Wklej JSON albo wybierz plik kopii zapasowej.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const imported = await importAnalysesToDatabase(source);
      setMessage(`Zaimportowano ${imported.length} analiz do bazy online.`);
      setJson("");
      await onChange();
    } catch (error) {
      setMessage(getStudioDatabaseErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="eyebrow">Kopia zapasowa</p>
          <h2 className="mt-2 text-2xl font-black text-white">Kopia zapasowa online</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Eksportuj kopię bieżących analiz z Supabase albo odtwórz dane z wcześniej zapisanej kopii JSON.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-secondary justify-center" onClick={exportJson} disabled={busy}>
            Eksportuj kopię JSON
          </button>
          <button type="button" className="btn-secondary justify-center" onClick={() => fileRef.current?.click()} disabled={busy}>
            Wybierz plik JSON
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          await importJson(await file.text());
          event.currentTarget.value = "";
        }}
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <textarea
          className="admin-textarea min-h-28"
          value={json}
          onChange={(event) => setJson(event.target.value)}
          placeholder="Wklej kopię JSON z analizami..."
        />
        <button type="button" className="btn-primary justify-center" onClick={() => void importJson(json)} disabled={busy}>
          {busy ? "Przetwarzanie..." : "Importuj kopię JSON"}
        </button>
      </div>

      {message && <p className="mt-4 text-sm font-bold text-cyan-100">{message}</p>}
    </section>
  );
}
