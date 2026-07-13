"use client";

import { useEffect } from "react";

export function AnalysisToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="analysis-toast" role="status" aria-live="polite">
      <span className="analysis-toast-dot" aria-hidden="true" />
      <p>{message}</p>
      <button type="button" onClick={onClose}>Zamknij</button>
    </div>
  );
}
