'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-20 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full animate-scale-in items-center gap-2.5 rounded-xl border bg-white py-2.5 pl-3 pr-2 text-[12.5px] font-medium shadow-lg sm:w-auto sm:max-w-sm ${
            t.type === 'success'
              ? 'border-emerald-200 text-emerald-900'
              : t.type === 'error'
                ? 'border-rose-200 text-rose-900'
                : 'border-indigo-200 text-indigo-950'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : t.type === 'error' ? (
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
          ) : (
            <Info className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
          )}
          <span className="flex-1 leading-snug">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="icon-btn shrink-0 p-1.5"
            aria-label="Tutup notifikasi"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
