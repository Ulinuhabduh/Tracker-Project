'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { NAV_ITEMS, type ViewKey } from './navigation';

interface BottomNavProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  onNewProject: () => void;
  todayCount: number;
  deadlineCount: number;
  projectOpen?: boolean;
}

export function BottomNav({
  view,
  onNavigate,
  onNewProject,
  todayCount,
  deadlineCount,
  projectOpen = false,
}: BottomNavProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="Navigasi utama"
        className="dock-enter pointer-events-auto flex max-w-[calc(100vw-2rem)] items-center gap-1 overflow-x-auto rounded-2xl border border-stone-200/80 bg-white/90 p-1.5 shadow-[0_12px_40px_-12px_rgb(28_25_23/0.25)] backdrop-blur-xl"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.key && !projectOpen;
          const badge =
            item.key === 'today' ? todayCount : item.key === 'deadlines' ? deadlineCount : 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={active ? 'page' : undefined}
              title={item.hint}
              className={`relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[12.5px] font-semibold transition-all active:scale-95 sm:px-3.5 ${
                active
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span className="relative" aria-hidden="true">
                <Icon className="h-[18px] w-[18px]" />
                {badge > 0 ? (
                  <span
                    className={`tnum absolute -right-2 -top-1.5 min-w-[16px] rounded-full px-1 text-center text-[9px] font-bold leading-[16px] ${
                      active ? 'bg-white text-stone-900' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </span>
              <span className="hidden min-[380px]:inline">{item.label}</span>
            </button>
          );
        })}

        <span className="mx-1 h-6 w-px shrink-0 bg-stone-200" aria-hidden="true" />

        <button
          type="button"
          onClick={onNewProject}
          title="Buat proyek baru"
          aria-label="Buat proyek baru"
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden="true" />
          <span className="hidden min-[380px]:inline">Baru</span>
        </button>
      </nav>
    </div>
  );
}
