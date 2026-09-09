'use client';

import React from 'react';
import { FolderKanban, CircleCheck, Gauge, Flame } from 'lucide-react';
import type { Project } from '@/lib/types';
import { ProgressBar } from './ui';

interface StatsCardsProps {
  projects: Project[];
  streak: number;
}

export const StatsCards = React.memo(function StatsCards({ projects, streak }: StatsCardsProps) {
  const total = projects.length;
  const active = projects.filter((p) => p.status === 'in_progress').length;
  const done = projects.filter((p) => p.status === 'completed').length;
  const avg =
    total > 0 ? Math.round(projects.reduce((a, p) => a + (p.progress_percent || 0), 0) / total) : 0;

  const cards = [
    {
      label: 'Proyek aktif',
      value: String(active),
      hint: total === 0 ? 'Belum ada proyek' : `dari ${total} proyek`,
      icon: <FolderKanban className="h-[18px] w-[18px]" aria-hidden="true" />,
      tint: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Selesai',
      value: String(done),
      hint: total > 0 ? `${Math.round((done / total) * 100)}% portfolio` : '—',
      icon: <CircleCheck className="h-[18px] w-[18px]" aria-hidden="true" />,
      tint: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Rata-rata progres',
      value: `${avg}%`,
      hint: 'Seluruh portfolio',
      icon: <Gauge className="h-[18px] w-[18px]" aria-hidden="true" />,
      tint: 'bg-sky-50 text-sky-600',
      bar: avg,
    },
    {
      label: 'Streak catatan',
      value: streak > 0 ? `${streak} hari` : '—',
      hint: streak > 0 ? 'Terus pertahankan' : 'Tulis log hari ini',
      icon: <Flame className="h-[18px] w-[18px]" aria-hidden="true" />,
      tint: streak > 0 ? 'bg-orange-50 text-orange-600' : 'bg-stone-100 text-stone-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[12px] font-medium text-stone-500">{c.label}</span>
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] ${c.tint}`}>
              {c.icon}
            </span>
          </div>
          <p className="tnum mt-2 text-[24px] font-bold leading-none tracking-tight text-stone-900">
            {c.value}
          </p>
          <p className="mt-1.5 truncate text-[11.5px] text-stone-500">{c.hint}</p>
          {typeof c.bar === 'number' ? <ProgressBar value={c.bar} className="mt-2.5" /> : null}
        </div>
      ))}
    </div>
  );
});
