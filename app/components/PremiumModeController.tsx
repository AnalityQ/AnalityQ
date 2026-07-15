"use client";

import { useEffect, useRef, useState } from "react";
import { isPremiumShortcut } from "@/lib/premium-mode-core";
import {
  activatePremiumMode,
  premiumModeChangedEvent,
  type PremiumActivationSource,
} from "@/lib/premium-mode";

export function PremiumModeController() {
  const [notice, setNotice] = useState("");
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    function showNotice(event: Event) {
      const source = (event as CustomEvent<{ source?: PremiumActivationSource }>).detail?.source;
      setNotice(source === "mobile"
        ? "Tryb Premium aktywny. Pełne sekcje raportów zostały odblokowane."
        : "Tryb Premium aktywny — pełne sekcje raportów są odblokowane.");
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setNotice(""), 3600);
    }

    function handleShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (target instanceof HTMLElement && (
        target.isContentEditable
        || target.tagName === "INPUT"
        || target.tagName === "TEXTAREA"
        || target.tagName === "SELECT"
      )) return;
      if (!isPremiumShortcut(event)) return;
      event.preventDefault();
      activatePremiumMode("keyboard");
    }

    window.addEventListener("keydown", handleShortcut);
    window.addEventListener(premiumModeChangedEvent, showNotice);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      window.removeEventListener(premiumModeChangedEvent, showNotice);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!notice) return null;
  return <div className="premium-mode-toast" role="status" aria-live="polite">{notice}</div>;
}
