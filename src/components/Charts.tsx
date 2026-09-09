'use client';

import React from 'react';
import { getStatusBadge } from '@/lib/utils';
import type { DayCount } from '@/lib/dashboard-utils';
import type { ProjectStatus } from '@/lib/types';

const SLICE_COLORS: Record<ProjectStatus, string> = {
  planning: '#a8a29e',
  in_progress: '#0ea5e9',
  on_hold: '#f59e0b',
  completed: '#10b981',
};

export function StatusDonut({
  data,
  total,
}: {
  data: { status: ProjectStatus; count: number }[];
  total: number;
}) {
  const R = 34;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const summary = data.map((d) => `${getStatusBadge(d.status).label}: ${d.count}`).join(', ');

  return (
    <div
      className="flex items-center gap-4"
      role="img"
      aria-label={total === 0 ? 'Belum ada proyek' : `Distribusi status. ${summary}.`}
    >
      <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0 -rotate-90" aria-hidden="true">
        <circle cx="48" cy="48" r={R} fill="none" stroke="#f0efed" strokeWidth="13" />
        {total > 0 &&
          data.map((d) => {
            if (d.count === 0) return null;
            const frac = d.count / total;
            const len = Math.max(frac * C - 2, 2);
            const el = (
              <circle
                key={d.status}
                cx="48"
                cy="48"
                r={R}
                fill="none"
                stroke={SLICE_COLORS[d.status]}
                strokeWidth="13"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
              />
            );
            offset += frac * C;
            return el;
          })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {data.map((d) => (
          <li key={d.status} className="flex items-center gap-2 text-[12px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
              style={{ background: SLICE_COLORS[d.status] }}
              aria-hidden="true"
            />
            <span className="flex-1 truncate text-stone-600">{getStatusBadge(d.status).label}</span>
            <span className="tnum font-bold text-stone-900">{d.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ActivityBars({ days }: { days: DayCount[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((a, d) => a + d.count, 0);
  return (
    <div
      role="img"
      aria-label={
        total === 0
          ? 'Belum ada catatan logbook minggu ini'
          : `${total} catatan dalam 7 hari terakhir, paling ramai ${days.reduce((a, b) => (b.count > a.count ? b : a)).label}.`
      }
    >
      <div className="flex h-28 items-end gap-2" aria-hidden="true">
        {days.map((d, i) => {
          const h = d.count === 0 ? 6 : Math.max(14, Math.round((d.count / max) * 100));
          const isToday = i === days.length - 1;
          return (
            <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end">
                <div
                  title={`${d.count} catatan`}
                  className={`w-full rounded-md ${isToday ? 'bg-indigo-600' : d.count > 0 ? 'bg-indigo-200' : 'bg-stone-200'}`}
                  style={{ height: `${h}%`, minHeight: 6 }}
                />
              </div>
              <span className={`text-[10px] font-medium capitalize ${isToday ? 'text-indigo-700' : 'text-stone-400'}`}>
                {d.label.slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
