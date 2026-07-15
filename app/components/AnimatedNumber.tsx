"use client";

import { useEffect, useState } from "react";

export function AnimatedNumber({ value, suffix = "" }: { value: number | null; suffix?: string }) {
  const [display, setDisplay] = useState(value ?? 0);

  useEffect(() => {
    if (value === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const reducedFrame = window.requestAnimationFrame(() => setDisplay(value));
      return () => window.cancelAnimationFrame(reducedFrame);
    }
    const startedAt = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 650);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{value === null ? "—" : `${display}${suffix}`}</>;
}
