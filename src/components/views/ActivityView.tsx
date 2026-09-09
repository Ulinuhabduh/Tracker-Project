'use client';

import React from 'react';
import { AlertTriangle, Calendar, Flag, NotebookPen, Rocket, StickyNote } from 'lucide-react';
import type { LogbookEntry, LogbookType } from '@/lib/types';
import { getLogTypeMeta } from '@/lib/utils';
import { Card, EmptyState } from '../ui';

interface ActivityViewProps {
  logs: LogbookEntry[];
  projectName: (id: string) => string;
  onOpenProject: (id: string) => void;
}

function LogIcon({ type }: { type: LogbookType }) {
  const cls = 'h-4 w-4';
  switch (type) {
    case 'daily_update':
      return <Calendar className={`${cls} text-sky-600`} aria-hidden="true" />;
    case 'milestone':
      return <Flag className={`${cls} text-violet-600`} aria-hidden="true" />;
    case 'blocker':
      return <AlertTriangle className={`${cls} text-rose-600`} aria-hidden="true" />;
    case 'release':
      return <Rocket className={`${cls} text-emerald-600`} aria-hidden="true" />;
    default:
      return <StickyNote className={`${cls} text-stone-400`} aria-hidden="true" />;
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const m = Math.floor(ms / 60_000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} mnt lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} hari lalu`;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(iso));
}

function excerpt(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`|\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

export function ActivityView({ logs, projectName, onOpenProject }: ActivityViewProps) {
  return (
    <div className="animate-fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-balance text-[22px] font-bold tracking-tight text-stone-900 sm:text-[26px]">
          Aktivitas terbaru
        </h1>
        <p className="mt-1 text-[13px] text-stone-500">
          {logs.length === 0
            ? 'Belum ada catatan.'
            : `${logs.length} catatan terakhir dari semua proyek.`}
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-6 w-6" aria-hidden="true" />}
          title="Belum ada aktivitas"
          desc="Setiap logbook yang Anda tulis di proyek mana pun akan muncul di sini sebagai linimasa."
        />
      ) : (
        <Card>
          <ol className="divide-y divide-stone-100">
            {logs.map((l) => {
              const meta = getLogTypeMeta(l.log_type);
              const text = excerpt(l.content_markdown);
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProject(l.project_id)}
                    className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50">
                      <LogIcon type={l.log_type} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                        <span className="truncate text-[11.5px] font-medium text-stone-500">
                          {projectName(l.project_id)}
                        </span>
                        <span className="text-[11px] text-stone-400" aria-hidden="true">
                          •
                        </span>
                        <time className="text-[11px] text-stone-400" dateTime={l.created_at}>
                          {timeAgo(l.created_at)}
                        </time>
                      </span>
                      <span className="mt-1 block truncate text-[13.5px] font-semibold text-stone-900">
                        {l.title}
                      </span>
                      {text ? (
                        <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-relaxed text-stone-500">
                          {text}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>
      )}
    </div>
  );
}
