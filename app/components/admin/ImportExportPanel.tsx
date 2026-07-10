"use client";

import { useRef, useState } from "react";
import {
  exportMatchesToJson,
  importMatchesFromJson,
  resetAllMatches,
} from "@/lib/storage";

export function ImportExportPanel({ onChange }: { onChange: () => void }) {
  const [json, setJson] = useState("");
  const [message, setMessage] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  function exportJson() {
    const content = exportMatchesToJson();
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analityq-analizy-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Export JSON gotowy.");
  }

  function importJson(source: string) {
    try {
      const count = importMatchesFromJson(source);
      setMessage(`Zaimportowano ${count} analiz.`);
      setJson("");
      onChange();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nie udało się zaimportować JSON.");
    }
  }

  function reset() {
    if (!window.confirm("Usunąć wszystkie analizy z localStorage?")) return;
    resetAllMatches();
    setMessage("Wyczyszczono lokalną bazę analiz.");
    onChange();
  }

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-xl">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <p className="eyebrow">Import / Export</p>
          <h2 className="mt-2 text-2xl font-black text-white">Lokalna baza JSON</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Export pobiera aktualne analizy. Import akceptuje tablicę JSON zgodną ze strukturą AnalityQ.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" className="btn-secondary justify-center" onClick={exportJson}>
            Export JSON
          </button>
          <button type="button" className="btn-secondary justify-center" onClick={() => fileRef.current?.click()}>
            Wybierz plik
          </button>
          <button type="button" className="btn-secondary justify-center" onClick={reset}>
            Reset
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
          importJson(await file.text());
          event.currentTarget.value = "";
        }}
      />

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto]">
        <textarea
          className="admin-textarea min-h-28"
          value={json}
          onChange={(event) => setJson(event.target.value)}
          placeholder="Wklej JSON z analizami..."
        />
        <button type="button" className="btn-primary justify-center" onClick={() => importJson(json)}>
          Import JSON
        </button>
      </div>

      {message && <p className="mt-4 text-sm font-bold text-cyan-100">{message}</p>}
    </section>
  );
}
