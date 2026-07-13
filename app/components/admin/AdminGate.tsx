"use client";

import { useEffect, useState } from "react";
import {
  getStudioSessionStatus,
  loginToStudio,
  logoutFromStudio,
  studioSessionChangedEvent,
  studioSessionExpiredEvent,
} from "@/lib/studio-auth";
import { Logo } from "../Logo";
import { AdminDashboard } from "./AdminDashboard";

type GateStatus = "checking" | "anonymous" | "authenticated";

export function AdminGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<GateStatus>("checking");

  useEffect(() => {
    let active = true;

    async function refreshSession() {
      const authenticated = await getStudioSessionStatus();
      if (active) setStatus(authenticated ? "authenticated" : "anonymous");
    }

    function handleSessionChanged() {
      void refreshSession();
    }

    function handleSessionExpired() {
      setStatus("anonymous");
      setError("Sesja wygasła. Zaloguj się ponownie.");
    }

    void refreshSession();
    window.addEventListener(studioSessionChangedEvent, handleSessionChanged);
    window.addEventListener(studioSessionExpiredEvent, handleSessionExpired);
    return () => {
      active = false;
      window.removeEventListener(studioSessionChangedEvent, handleSessionChanged);
      window.removeEventListener(studioSessionExpiredEvent, handleSessionExpired);
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = await loginToStudio(password);
    if (result.ok) {
      setPassword("");
      setStatus("authenticated");
    } else {
      setError(result.message);
    }
    setBusy(false);
  }

  async function logout() {
    await logoutFromStudio();
    setPassword("");
    setError("");
    setStatus("anonymous");
  }

  if (status === "authenticated") {
    return <AdminDashboard onLogout={() => void logout()} />;
  }

  return (
    <section className="section-shell">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <Logo href="" />
        <p className="eyebrow mt-8">Przestrzeń robocza</p>
        <h1 className="mt-3 text-3xl font-black text-white">Dostęp do studio</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {status === "checking"
            ? "Sprawdzanie bezpiecznej sesji Studio…"
            : "Wprowadź hasło, aby utworzyć bezpieczną sesję Studio w tej przeglądarce."}
        </p>
        {status === "anonymous" && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-300">Hasło</span>
              <input
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
        )}
      </div>
    </section>
  );
}
