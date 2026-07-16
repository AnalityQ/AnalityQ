"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({ value, suffix = "" }: { value: number | null | undefined; suffix?: string }) {
  const roundedValue = typeof value === "number" ? Math.round(value) : null;
  const [display, setDisplay] = useState(roundedValue ?? 0);

  useEffect(() => {
    if (roundedValue === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedFrame = window.requestAnimationFrame(() => setDisplay(roundedValue));
      return () => window.cancelAnimationFrame(reducedFrame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 650);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(roundedValue * eased));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [roundedValue]);

  return <>{roundedValue === null ? "—" : `${display}${suffix}`}</>;
}
