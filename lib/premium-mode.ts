"use client";

import { useSyncExternalStore } from "react";

const premiumModeStorageKey = "analityq-premium-demo";
export const premiumModeChangedEvent = "analityq-premium-mode-changed";

export type PremiumActivationSource = "keyboard" | "mobile";

function readPremiumMode() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(premiumModeStorageKey) === "enabled";
  } catch {
    return false;
  }
}

export function activatePremiumMode(source: PremiumActivationSource) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(premiumModeStorageKey, "enabled");
    window.dispatchEvent(new CustomEvent(premiumModeChangedEvent, { detail: { active: true, source } }));
    return true;
  } catch {
    return false;
  }
}

function subscribePremiumMode(callback: () => void) {
  window.addEventListener(premiumModeChangedEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(premiumModeChangedEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function usePremiumMode() {
  const active = useSyncExternalStore(subscribePremiumMode, readPremiumMode, () => false);
  return { active };
}
