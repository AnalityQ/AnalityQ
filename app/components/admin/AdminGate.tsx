"use client";

import { useState, useSyncExternalStore } from "react";
import { adminPassword } from "@/lib/analityq-data";
import { AdminDashboard } from "./AdminDashboard";

const gateKey = "analityq.admin.unlocked";
const gateEvent = "analityq-admin-gate";

function subscribeGate(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(gateEvent, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(gateEvent, onStoreChange);
  };
}

function getGateSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(gateKey) === "true";
}

function getServerGateSnapshot() {
  return false;
}

function notifyGateChange() {
  window.dispatchEvent(new Event(gateEvent));
}

export function AdminGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const unlocked = useSyncExternalStore(subscribeGate, getGateSnapshot, getServerGateSnapshot);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password === adminPassword) {
      window.localStorage.setItem(gateKey, "true");
      setError("");
      notifyGateChange();
    } else {
      setError("Nieprawidłowe hasło demo.");
    }
  }

  function logout() {
    window.localStorage.removeItem(gateKey);
    setPassword("");
    notifyGateChange();
  }

  if (unlocked) {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <section className="section-shell">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
        <p className="eyebrow">Panel admina</p>
        <h1 className="mt-3 text-3xl font-black text-white">Dostęp demo</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          To lokalna blokada prototypu. Po wpisaniu hasła odblokowanie zostanie zapisane w localStorage.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-300">Hasło</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="admin-input mt-2"
              placeholder="Wpisz hasło demo"
            />
          </label>
          {error && <p className="text-sm font-bold text-amber-100">{error}</p>}
          <button type="submit" className="btn-primary w-full justify-center">
            Odblokuj panel
          </button>
        </form>
      </div>
    </section>
  );
}
