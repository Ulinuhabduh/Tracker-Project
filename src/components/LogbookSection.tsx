'use client';

import React from 'react';
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  Download,
  Flag,
  NotebookPen,
  Pencil,
  Plus,
  Rocket,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import type { LogbookEntry, LogbookType, Project } from '@/lib/types';
import { formatDateTime, getLogTypeMeta, renderMarkdownToHtml } from '@/lib/utils';
import { LogbookEditor } from './LogbookEditor';
import { LogbookPrintPreview } from './LogbookPrint';
import { Card, EmptyState, SectionHead } from './ui';

interface LogbookSectionProps {
  projectId: string;
  project: Project;
  logbooks: LogbookEntry[];
  onSaveLogbook: (d: Partial<LogbookEntry>) => Promise<void>;
  onDeleteLogbook: (id: string) => Promise<void>;
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

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'daily_update', label: 'Harian' },
  { key: 'blocker', label: 'Kendala' },
  { key: 'milestone', label: 'Milestone' },
  { key: 'release', label: 'Rilis' },
];

export function LogbookSection({ projectId, project, logbooks, onSaveLogbook, onDeleteLogbook }: LogbookSectionProps) {
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<LogbookEntry | null>(null);
  const [printing, setPrinting] = React.useState(false);
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (logbooks.length > 0) {
      setOpen((prev) => (Object.keys(prev).length === 0 ? { [logbooks[0].id]: true } : prev));
    }
  }, [logbooks]);

  const save = async (data: Partial<LogbookEntry>) => {
    await onSaveLogbook(data);
    setCreating(false);
    setEditing(null);
  };

  const q = query.trim().toLowerCase();
  const list = logbooks.filter((l) => {
    if (filter !== 'all' && l.log_type !== filter) return false;
    if (!q) return true;
    return (
      l.title.toLowerCase().includes(q) ||
      l.content_markdown.toLowerCase().includes(q) ||
      l.blockers?.toLowerCase().includes(q) ||
      l.tags?.some((t) => t.toLowerCase().includes(q))
    );
  });

  const editorOpen = creating || editing !== null;
  const filterLabel =
    (filter === 'all' ? 'Semua' : getLogTypeMeta(filter as LogbookType).label) +
    (q ? ` • Cari “${query.trim()}”` : '');

  return (
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_264px]">
      <div className="min-w-0 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <SectionHead title={`Logbook (${logbooks.length})`} desc="Progres, kendala & rilis" />
        {!editorOpen ? (
          <span className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPrinting(true)}
              disabled={list.length === 0}
              className="btn-secondary px-2.5 py-1.5 text-[12px] disabled:opacity-45"
              title="Unduh logbook sebagai PDF (A4 landscape)"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" /> PDF
            </button>
            <button type="button" onClick={() => setCreating(true)} className="btn-primary px-3 py-1.5 text-[12px]">
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> Tulis log
            </button>
          </span>
        ) : null}
      </div>

      {editorOpen ? (
        <LogbookEditor
          projectId={projectId}
          initialData={editing}
          onSave={save}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      ) : null}

      <Card className="flex items-center gap-2 p-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <label htmlFor="cari-log" className="sr-only">
            Cari catatan
          </label>
          <input
            id="cari-log"
            type="text"
            autoComplete="off"
            placeholder="Cari catatan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="field py-1.5 pl-8 pr-7 text-[12px]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="icon-btn absolute right-1 top-1/2 -translate-y-1/2 p-1"
              aria-label="Hapus pencarian logbook"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <div className="scrollbar-none flex shrink-0 items-center gap-1 overflow-x-auto" role="tablist" aria-label="Filter tipe log">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] transition-colors ${
                filter === f.key
                  ? 'bg-stone-900 font-semibold text-white'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      {list.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="h-6 w-6" aria-hidden="true" />}
          title="Belum ada catatan"
          desc="Mulai dengan entri pertama — ceritakan progres hari ini atau kendala yang ditemui."
          action={
            !editorOpen ? (
              <button type="button" onClick={() => setCreating(true)} className="btn-primary px-4 py-2 text-[12.5px]">
                <Plus className="h-4 w-4" aria-hidden="true" /> Tulis entri pertama
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {list.map((log) => {
            const expanded = !!open[log.id];
            const meta = getLogTypeMeta(log.log_type);
            return (
              <article
                key={log.id}
                className={`card overflow-hidden ${log.log_type === 'blocker' ? 'border-rose-200' : ''}`}
              >
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50">
                    <LogIcon type={log.log_type} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen((p) => ({ ...p, [log.id]: !p[log.id] }))}
                    className="min-w-0 flex-1 text-left"
                    aria-expanded={expanded}
                    aria-label={`${expanded ? 'Tutup' : 'Buka'} catatan ${log.title}`}
                  >
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                      <time className="text-[10.5px] text-stone-400" dateTime={log.created_at}>
                        {formatDateTime(log.created_at)}
                      </time>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] font-semibold text-stone-900">
                      {log.title}
                    </span>
                  </button>
                  <span className="flex shrink-0 items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(log);
                        setCreating(false);
                      }}
                      className="icon-btn p-1.5"
                      aria-label={`Ubah catatan ${log.title}`}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteLogbook(log.id)}
                      className="icon-btn p-1.5 hover:text-rose-700"
                      aria-label={`Hapus catatan ${log.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpen((p) => ({ ...p, [log.id]: !p[log.id] }))}
                      className="icon-btn p-1.5"
                      aria-label={expanded ? 'Tutup isi catatan' : 'Buka isi catatan'}
                      aria-expanded={expanded}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        style={{ transitionProperty: 'transform' }}
                        aria-hidden="true"
                      />
                    </button>
                  </span>
                </div>
                {expanded ? (
                  <div className="animate-fade-up border-t border-stone-100 bg-stone-50/60 px-3.5 py-3">
                    {log.blockers ? (
                      <p className="mb-2.5 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-relaxed text-rose-900">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                        <span>
                          <strong className="font-semibold">Kendala:</strong> {log.blockers}
                        </span>
                      </p>
                    ) : null}
                    <div
                      className="prose-live max-w-none text-[12.5px] leading-relaxed text-stone-600"
                      dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(log.content_markdown) }}
                    />
                    {log.tags?.length ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-stone-200/70 pt-2.5">
                        {log.tags.map((t) => (
                          <span key={t} className="chip mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      </div>

      {/* Ringkasan samping — hemat scroll vertikal */}
      <Card className="hidden p-3.5 xl:block xl:sticky xl:top-[132px]">
        <h3 className="text-[12.5px] font-bold text-stone-900">Ringkasan log</h3>
        <dl className="mt-2.5 space-y-1.5 text-[12px]">
          {FILTERS.filter((f) => f.key !== 'all').map((f) => {
            const n = logbooks.filter((l) => l.log_type === f.key).length;
            return (
              <div key={f.key} className="flex items-center justify-between rounded-lg bg-stone-50 px-2.5 py-1.5">
                <dt className="text-stone-500">{f.label}</dt>
                <dd className="tnum font-bold text-stone-800">{n}</dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-2.5 text-[11px] leading-relaxed text-stone-400">
          Total {logbooks.length} entri • {filterLabel}
        </p>
      </Card>

      {printing ? (
        <LogbookPrintPreview
          project={project}
          entries={list}
          filterLabel={filterLabel}
          onClose={() => setPrinting(false)}
        />
      ) : null}
    </div>
  );
}
