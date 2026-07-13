"use client";

import { Logo } from "../Logo";

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="studio-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="studio-modal">
        <button type="button" className="studio-modal-close" onClick={onCancel}>Zamknij</button>
        <Logo href="" />
        <p className="eyebrow mt-7">Potwierdzenie</p>
        <h2 className="mt-3 text-2xl font-black text-white">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{message}</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" className="btn-secondary justify-center" onClick={onCancel}>Anuluj</button>
          <button type="button" className="btn-primary justify-center" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
