'use client';

import React from 'react';
import { CheckCheck, Cloud, HardDrive, Plus, Search, Settings } from 'lucide-react';
import { Avatar } from './ui';

interface TopbarProps {
  onOpenPalette: () => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
  userEmail: string;
  cloudActive: boolean;
  onOpenAuth: () => void;
}

export function Topbar({
  onOpenPalette,
  onNewProject,
  onOpenSettings,
  userEmail,
  cloudActive,
  onOpenAuth,
}: TopbarProps) {
  return (
    <div className="sticky top-3 z-30 mx-auto w-full max-w-[1400px] px-4 sm:px-6">
      <header className="flex h-14 items-center gap-2 rounded-2xl border border-stone-200/80 bg-white/85 px-2.5 shadow-[0_8px_30px_-12px_rgb(28_25_23/0.15)] backdrop-blur-xl sm:px-3">
        {/* Brand — selalu tampil (sidebar sudah dihapus) */}
        <span className="flex shrink-0 items-center gap-2 pl-1" aria-label="Tracker Nexus">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <CheckCheck className="h-[18px] w-[18px]" strokeWidth={2.5} />
          </span>
          <span className="hidden text-[14px] font-bold tracking-tight text-stone-900 md:inline">
            Tracker Nexus
          </span>
        </span>

        {/* Command palette trigger */}
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-transparent bg-stone-100/80 px-3 py-2 text-left text-[13px] text-stone-400 transition-colors hover:border-stone-300 hover:bg-white hover:text-stone-600 sm:max-w-xs"
          aria-label="Cari proyek & perintah (Control K)"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 truncate">Cari proyek, tugas…</span>
          <span className="kbd hidden shrink-0 lg:inline-flex" aria-hidden="true">
            Ctrl&nbsp;K
          </span>
        </button>

        {/* Status sinkron — desktop */}
        <span
          className="hidden shrink-0 items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-[11px] font-medium text-stone-500 xl:inline-flex"
          title={cloudActive ? 'Tersimpan di cloud' : 'Tersimpan lokal'}
        >
          {cloudActive ? (
            <Cloud className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          ) : (
            <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {cloudActive ? 'Cloud' : 'Lokal'}
        </span>

        <button
          type="button"
          onClick={onNewProject}
          className="btn-primary hidden shrink-0 px-3.5 py-2 text-[13px] md:inline-flex"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          Proyek baru
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          className="icon-btn shrink-0 p-2"
          aria-label="Pengaturan & backup"
          title="Pengaturan & backup"
        >
          <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onOpenAuth}
          className="flex shrink-0 items-center gap-2 rounded-xl py-1 pl-1 pr-1 transition-colors hover:bg-stone-100 sm:pr-2"
          aria-label={userEmail ? `Akun ${userEmail}` : 'Masuk ke akun'}
          title={userEmail || 'Masuk'}
        >
          <Avatar email={userEmail} />
          <span className="hidden max-w-[140px] truncate text-left text-[12px] font-medium text-stone-700 lg:inline">
            {userEmail || 'Masuk'}
          </span>
        </button>
      </header>
    </div>
  );
}
