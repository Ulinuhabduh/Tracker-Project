'use client';

import React from 'react';
import { ArrowRight, CalendarClock, Inbox } from 'lucide-react';
import type { Project } from '@/lib/types';
import { dueLabel, shortDate, type DeadlineBucket } from '@/lib/dashboard-utils';
import { Card, EmptyState, ProgressBar } from '../ui';

interface DeadlinesViewProps {
  grouped: Record<DeadlineBucket, Project[]>;
  onOpenProject: (id: string) => void;
}

const SECTIONS: { key: DeadlineBucket; title: string; desc: string }[] = [
  { key: 'overdue', title: 'Terlambat', desc: 'Dahulukan yang ini' },
  { key: 'week', title: 'Minggu ini', desc: 'Jatuh tempo ≤ 7 hari' },
  { key: 'later', title: 'Berikutnya', desc: 'Masih longgar' },
  { key: 'none', title: 'Tanpa deadline', desc: 'Pertimbangkan menambah target' },
];

export function DeadlinesView({ grouped, onOpenProject }: DeadlinesViewProps) {
  const total = SECTIONS.reduce((a, s) => a + grouped[s.key].length, 0);

  return (
    <div className="animate-fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-balance text-[22px] font-bold tracking-tight text-stone-900 sm:text-[26px]">
          Linimasa tenggat
        </h1>
        <p className="mt-1 text-[13px] text-stone-500">
          {total === 0 ? 'Belum ada proyek untuk dilacak.' : `${total} proyek terpetakan by deadline.`}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" aria-hidden="true" />}
          title="Belum ada proyek"
          desc="Buat proyek pertama Anda untuk melihat linimasa tenggat di sini."
        />
      ) : (
        SECTIONS.map((s) => {
          const items = grouped[s.key];
          if (items.length === 0) return null;
          return (
            <section key={s.key} aria-label={s.title}>
              <div className="mb-2 flex items-baseline gap-2 px-1">
                <h2 className="text-[13px] font-bold text-stone-900">{s.title}</h2>
                <span className="tnum text-[11px] text-stone-400">{items.length}</span>
                <span className="text-[11px] text-stone-400">• {s.desc}</span>
              </div>
              <Card>
                <ul className="divide-y divide-stone-100">
                  {items.map((p) => {
                    const late = s.key === 'overdue';
                    return (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => onOpenProject(p.id)}
                          className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50"
                        >
                          <CalendarClock
                            className={`h-4 w-4 shrink-0 ${late ? 'text-rose-600' : 'text-stone-400'}`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13.5px] font-semibold text-stone-900">
                              {p.title}
                            </span>
                            <span className="mt-1 flex items-center gap-2">
                              <span className="w-28 sm:w-40">
                                <ProgressBar value={p.progress_percent} />
                              </span>
                              <span className="tnum text-[11px] text-stone-500">{p.progress_percent}%</span>
                            </span>
                          </span>
                          <span
                            className={`mono shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold ${
                              late ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {s.key === 'none' ? '—' : shortDate(p.due_date)}
                          </span>
                          <span
                            className={`hidden shrink-0 text-[11.5px] font-medium sm:inline ${late ? 'text-rose-700' : 'text-stone-500'}`}
                          >
                            {dueLabel(p.due_date)}
                          </span>
                          <ArrowRight
                            className="h-4 w-4 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500"
                            aria-hidden="true"
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>
          );
        })
      )}
    </div>
  );
}
