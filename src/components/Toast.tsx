'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md text-xs font-medium animate-fade-in transition-all ${
            t.type === 'success'
              ? 'bg-zinc-900/95 border-emerald-500/40 text-emerald-300'
              : t.type === 'error'
              ? 'bg-zinc-900/95 border-rose-500/40 text-rose-300'
              : 'bg-zinc-900/95 border-indigo-500/40 text-indigo-300'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          )}
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-zinc-500 hover:text-white ml-2 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
