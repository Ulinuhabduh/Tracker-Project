'use client';

import React from 'react';
import { NAV_ITEMS, type ViewKey } from './navigation';

interface BottomNavProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  todayCount: number;
  deadlineCount: number;
}

export function BottomNav({ view, onNavigate, todayCount, deadlineCount }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigasi utama"
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.key;
          const badge =
            item.key === 'today' ? todayCount : item.key === 'deadlines' ? deadlineCount : 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors ${
                active ? 'text-indigo-700' : 'text-stone-500'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {active ? (
                <span
                  className="absolute inset-x-8 top-0 h-0.5 rounded-full bg-indigo-600"
                  aria-hidden="true"
                />
              ) : null}
              <span className="relative" aria-hidden="true">
                <Icon className="h-5 w-5" />
                {badge > 0 ? (
                  <span className="tnum absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-rose-600 px-1 text-center text-[9px] font-bold leading-[16px] text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                ) : null}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
