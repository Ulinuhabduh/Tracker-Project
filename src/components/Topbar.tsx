'use client';

import React from 'react';
import { CheckCheck, Plus, Search } from 'lucide-react';
import { Avatar } from './ui';

interface TopbarProps {
  onOpenPalette: () => void;
  onNewProject: () => void;
  userEmail: string;
  onOpenAuth: () => void;
}

export function Topbar({ onOpenPalette, onNewProject, userEmail, onOpenAuth }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#f6f6f4]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:px-6">
        {/* Brand — mobile only (desktop uses sidebar) */}
        <span className="flex items-center gap-2 lg:hidden" aria-label="Tracker Nexus">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-600 text-white"
            aria-hidden="true"
          >
            <CheckCheck className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
          <span className="text-[14px] font-bold tracking-tight text-stone-900">Tracker Nexus</span>
        </span>

        {/* Command palette trigger */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="ml-auto flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-stone-300 bg-white px-3 py-2 text-left text-[13px] text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-600 sm:max-w-sm lg:ml-0"
          aria-label="Cari proyek & perintah (Control K)"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">Cari proyek, tugas, perintah…</span>
          <span className="kbd hidden shrink-0 sm:inline-flex" aria-hidden="true">
            Ctrl&nbsp;K
          </span>
        </button>

        <button
          type="button"
          onClick={onNewProject}
          className="btn-primary hidden shrink-0 px-3.5 py-2 text-[13px] sm:inline-flex"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          Baru
        </button>

        <button
          type="button"
          onClick={onOpenAuth}
          className="shrink-0 rounded-full transition-transform active:scale-95 lg:hidden"
          aria-label={userEmail ? `Akun ${userEmail}` : 'Masuk ke akun'}
          title={userEmail || 'Masuk'}
        >
          <Avatar email={userEmail} />
        </button>
      </div>
    </header>
  );
}

export function MobileNewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary fixed bottom-[76px] right-4 z-40 rounded-2xl p-0 shadow-lg sm:hidden"
      style={{ height: 52, width: 52 }}
      aria-label="Buat proyek baru"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
