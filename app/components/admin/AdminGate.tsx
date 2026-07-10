"use client";

import { useState, useSyncExternalStore } from "react";
import { STUDIO_PASSWORD, studioSessionEvent, studioSessionKey } from "@/lib/studio-auth";
import { Logo } from "../Logo";
import { AdminDashboard } from "./AdminDashboard";

function subscribeGate(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(studioSessionEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(studioSessionEvent, onStoreChange);
  };
}

function getGateSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(studioSessionKey) === "true";
}

function getServerGateSnapshot() {
  return false;
}

function notifyGateChange() {
  window.dispatchEvent(new Event(studioSessionEvent));
}

export function AdminGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const unlocked = useSyncExternalStore(subscribeGate, getGateSnapshot, getServerGateSnapshot);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === STUDIO_PASSWORD) {
      window.localStorage.setItem(studioSessionKey, "true");
      setError("");
      notifyGateChange();
    } else {
      setError("Nieprawidłowe hasło.");
    }
  }

  function logout() {
    window.localStorage.removeItem(studioSessionKey);
    setPassword("");
    notifyGateChange();
  }

  if (unlocked) {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <section className="section-shell">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <Logo href="" />
        <p className="eyebrow mt-8">Przestrzeń robocza</p>
        <h1 className="mt-3 text-3xl font-black text-white">Dostęp do studio</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          To prototypowa blokada panelu. Po wpisaniu hasła dostęp zostanie zapamiętany w tej przeglądarce.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-300">Hasło</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-input mt-2"
              placeholder="Wpisz hasło"
            />
          </label>
          {error && <p className="text-sm font-bold text-amber-100">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center">
            Wejdź do panelu
          </button>
        </form>
      </div>
    </section>
  );
}
