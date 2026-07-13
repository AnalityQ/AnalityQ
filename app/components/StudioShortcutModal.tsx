"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginToStudio, studioAccessOpenEvent } from "@/lib/studio-auth";
import { Logo } from "./Logo";

export function StudioShortcutModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function openModal() {
      setOpen(true);
      setError("");
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "q") {
        event.preventDefault();
        openModal();
      }
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(studioAccessOpenEvent, openModal);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(studioAccessOpenEvent, openModal);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await loginToStudio(password);
    if (result.ok) {
      setOpen(false);
      setPassword("");
      router.push("/studio");
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  if (!open) return null;

  return (
    <div className="studio-modal-backdrop" role="dialog" aria-modal="true" aria-label="Dostęp do panelu">
      <div className="studio-modal">
        <button
          type="button"
          className="studio-modal-close"
          onClick={() => setOpen(false)}
        >
          Zamknij
        </button>
        <Logo href="" />
        <p className="eyebrow mt-7">Dostęp prywatny</p>
        <h2 className="mt-3 text-2xl font-black text-white">Wejdź do panelu</h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Wprowadź hasło, aby otworzyć ukrytą przestrzeń roboczą AnalityQ.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-300">Hasło</span>
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-input mt-2"
              placeholder="Wpisz hasło"
              autoComplete="current-password"
              disabled={busy}
            />
          </label>
          {error && <p className="text-sm font-bold text-amber-100">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? "Logowanie…" : "Wejdź do panelu"}
          </button>
        </form>
      </div>
    </div>
  );
}
