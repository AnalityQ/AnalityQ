"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItems } from "@/lib/analityq-data";
import { studioAccessOpenEvent } from "@/lib/studio-auth";
import { Logo } from "./Logo";

const logoTapSequenceKey = "analityq.logo.tap-sequence";
const logoTapWindowMs = 3000;
const logoTapTarget = 7;
const logoLongPressMs = 10000;

type LogoTapSequence = {
  count: number;
  startedAt: number;
  lastAt: number;
};

function readLogoTapSequence(now: number): LogoTapSequence {
  if (typeof window === "undefined") {
    return { count: 0, startedAt: now, lastAt: now };
  }

  try {
    const raw = window.sessionStorage.getItem(logoTapSequenceKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<LogoTapSequence>) : null;

    if (
      !parsed ||
      typeof parsed.count !== "number" ||
      typeof parsed.startedAt !== "number" ||
      typeof parsed.lastAt !== "number" ||
      now - parsed.startedAt > logoTapWindowMs ||
      now - parsed.lastAt > logoTapWindowMs
    ) {
      return { count: 0, startedAt: now, lastAt: now };
    }

    return { count: parsed.count, startedAt: parsed.startedAt, lastAt: parsed.lastAt };
  } catch {
    return { count: 0, startedAt: now, lastAt: now };
  }
}

function writeLogoTapSequence(sequence: LogoTapSequence) {
  try {
    window.sessionStorage.setItem(logoTapSequenceKey, JSON.stringify(sequence));
  } catch {
    // Ukryty trigger nie powinien wpływać na normalną nawigację, jeśli storage jest niedostępny.
  }
}

function clearLogoTapSequence() {
  try {
    window.sessionStorage.removeItem(logoTapSequenceKey);
  } catch {
    // Bezpieczne wyciszenie dla trybów prywatnych i restrykcji przeglądarki.
  }
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tapResetTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const suppressNextLogoClickRef = useRef(false);

  const closeMenu = () => setOpen(false);

  function clearTapTimer() {
    if (tapResetTimerRef.current) {
      window.clearTimeout(tapResetTimerRef.current);
      tapResetTimerRef.current = null;
    }
  }

  function cancelLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function openHiddenAccess() {
    clearTapTimer();
    cancelLongPress();
    clearLogoTapSequence();
    setOpen(false);
    window.dispatchEvent(new Event(studioAccessOpenEvent));
  }

  function scheduleTapReset() {
    clearTapTimer();
    tapResetTimerRef.current = window.setTimeout(() => {
      clearLogoTapSequence();
      tapResetTimerRef.current = null;
    }, logoTapWindowMs);
  }

  function handleLogoClickCapture(event: React.MouseEvent) {
    if (suppressNextLogoClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
      suppressNextLogoClickRef.current = false;
      return;
    }

    const now = Date.now();
    const sequence = readLogoTapSequence(now);
    const nextSequence = {
      count: sequence.count + 1,
      startedAt: sequence.count === 0 ? now : sequence.startedAt,
      lastAt: now,
    };

    if (nextSequence.count >= logoTapTarget && now - nextSequence.startedAt <= logoTapWindowMs) {
      event.preventDefault();
      event.stopPropagation();
      openHiddenAccess();
      return;
    }

    writeLogoTapSequence(nextSequence);
    scheduleTapReset();
  }

  function handleLogoPointerDownCapture(event: React.PointerEvent) {
    if (event.button !== 0) return;
    cancelLongPress();

    longPressTimerRef.current = window.setTimeout(() => {
      suppressNextLogoClickRef.current = true;
      openHiddenAccess();
    }, logoLongPressMs);
  }

  function handleLogoPointerUpCapture() {
    cancelLongPress();
  }

  function handleLogoContextMenuCapture(event: React.MouseEvent) {
    if (suppressNextLogoClickRef.current) {
      event.preventDefault();
    }
  }

  useEffect(() => {
    return () => {
      clearTapTimer();
      cancelLongPress();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020713]/78 backdrop-blur-2xl">
      <div className="mx-auto flex min-h-20 w-[min(1180px,calc(100%-32px))] items-center justify-between gap-4">
        <span
          className="inline-flex"
          onClickCapture={handleLogoClickCapture}
          onPointerDownCapture={handleLogoPointerDownCapture}
          onPointerUpCapture={handleLogoPointerUpCapture}
          onPointerCancelCapture={handleLogoPointerUpCapture}
          onPointerLeave={handleLogoPointerUpCapture}
          onContextMenuCapture={handleLogoContextMenuCapture}
        >
          <Logo />
        </span>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Główna nawigacja">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/analizy" className="btn-primary">
            Zobacz analizy
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-button lg:hidden"
          aria-label={open ? "Zamknij menu" : "Otwórz menu"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={open ? "translate-y-[7px] rotate-45" : ""} />
          <span className={open ? "opacity-0" : ""} />
          <span className={open ? "-translate-y-[7px] -rotate-45" : ""} />
        </button>
      </div>

      <div className={`mobile-panel lg:hidden ${open ? "mobile-panel-open" : ""}`}>
        <nav className="grid gap-2" aria-label="Nawigacja mobilna">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`mobile-nav-link ${active ? "mobile-nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 grid gap-3">
          <Link href="/analizy" onClick={closeMenu} className="btn-primary justify-center">
            Zobacz analizy
          </Link>
        </div>
      </div>
    </header>
  );
}
