'use client';

import React from 'react';
import { ArrowRight, CalendarClock, FolderPlus, Search, X } from 'lucide-react';
import type { LogbookEntry, Project, ProjectStatus } from '@/lib/types';
import {
  activityLast7Days,
  computeStreak,
  greeting,
  statusDistribution,
  todayLabel,
} from '@/lib/dashboard-utils';
import { isOverdue } from '@/lib/dashboard-utils';
import { StatsCards } from '../StatsCards';
import { ActivityBars, StatusDonut } from '../Charts';
import { ProjectCard } from '../ProjectCard';
import { getLogTypeMeta } from '@/lib/utils';
import { Card, EmptyState, SectionHead } from '../ui';
import type { ViewKey } from '../navigation';

interface DashboardViewProps {
  userEmail: string;
  projects: Project[];
  recentLogs: LogbookEntry[];
  onOpenProject: (id: string) => void;
  onEdit: (p: Project) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: ProjectStatus) => void;
  onNewProject: () => void;
  onNavigate: (view: ViewKey) => void;
}

type SortKey = 'updated' | 'deadline' | 'progress' | 'title';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'in_progress', label: 'Berjalan' },
  { key: 'planning', label: 'Rencana' },
  { key: 'on_hold', label: 'Tertunda' },
  { key: 'completed', label: 'Selesai' },
];

export function DashboardView({
  userEmail,
  projects,
  recentLogs,
  onOpenProject,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onNewProject,
  onNavigate,
}: DashboardViewProps) {
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [sort, setSort] = React.useState<SortKey>('updated');

  const firstName = userEmail ? userEmail.split('@')[0] : '';
  const streak = React.useMemo(() => computeStreak(recentLogs), [recentLogs]);
  const week = React.useMemo(() => activityLast7Days(recentLogs), [recentLogs]);
  const dist = React.useMemo(() => statusDistribution(projects), [projects]);
  const attention = React.useMemo(
    () => projects.filter((p) => isOverdue(p.due_date, p.status)).slice(0, 4),
    [projects]
  );
  const categories = React.useMemo(
    () => Array.from(new Set(projects.map((p) => p.category).filter(Boolean))),
    [projects]
  );
  const [category, setCategory] = React.useState('all');

  const list = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (status !== 'all' && p.status !== status) return false;
        if (category !== 'all' && p.category !== category) return false;
        if (q) {
          return (
            p.title.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === 'deadline') return String(a.due_date).localeCompare(String(b.due_date));
        if (sort === 'progress') return (b.progress_percent || 0) - (a.progress_percent || 0);
        if (sort === 'title') return a.title.localeCompare(b.title);
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
  }, [projects, query, status, category, sort]);

  const filtering = query.trim() !== '' || status !== 'all' || category !== 'all';
  const resetFilters = () => {
    setQuery('');
    setStatus('all');
    setCategory('all');
  };

  return (
    <div className="animate-fade-up space-y-5">
      {/* Greeting */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-indigo-600">
          {todayLabel()}
        </p>
        <h1 className="mt-1 text-balance text-[22px] font-bold tracking-tight text-stone-900 sm:text-[26px]">
          {greeting()}
          {firstName ? `, ${firstName}` : ''} — ini fokus Anda hari ini.
        </h1>
      </div>

      <StatsCards projects={projects} streak={streak} />

      <div className="grid items-start gap-4 xl:grid-cols-3">
        {/* Projects */}
        <div className="space-y-3 xl:col-span-2">
          <Card className="p-3">
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <label htmlFor="cari-proyek" className="sr-only">
                  Cari proyek
                </label>
                <input
                  id="cari-proyek"
                  type="text"
                  autoComplete="off"
                  placeholder="Cari proyek, tag, kategori…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="field py-2.5 pl-9 pr-8 text-[13px]"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2 p-1"
                    aria-label="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
              <div className="flex gap-2">
                <label htmlFor="filter-kategori" className="sr-only">
                  Filter kategori
                </label>
                <select
                  id="filter-kategori"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="field w-auto flex-1 px-3 py-2.5 text-[12.5px] md:flex-none"
                >
                  <option value="all">Semua kategori</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <label htmlFor="urut-proyek" className="sr-only">
                  Urutkan proyek
                </label>
                <select
                  id="urut-proyek"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="field w-auto px-3 py-2.5 text-[12.5px]"
                >
                  <option value="updated">Terbaru</option>
                  <option value="deadline">Deadline</option>
                  <option value="progress">Progres</option>
                  <option value="title">Nama A–Z</option>
                </select>
              </div>
            </div>
            <div
              className="scrollbar-none mt-2 flex items-center gap-1 overflow-x-auto border-t border-stone-100 pt-2"
              role="tablist"
              aria-label="Filter status"
            >
              {STATUS_TABS.map((t) => {
                const n = t.key === 'all' ? projects.length : projects.filter((p) => p.status === t.key).length;
                const on = status === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setStatus(t.key)}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                      on
                        ? 'bg-stone-900 font-semibold text-white'
                        : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    {t.label} <span className={`tnum ml-1 ${on ? 'text-stone-300' : 'text-stone-400'}`}>{n}</span>
                  </button>
                );
              })}
              {filtering ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                >
                  <X className="h-3 w-3" aria-hidden="true" /> Reset
                </button>
              ) : null}
            </div>
          </Card>

          {list.length === 0 ? (
            <EmptyState
              icon={<FolderPlus className="h-6 w-6" aria-hidden="true" />}
              title={filtering ? 'Tidak ada hasil' : 'Mulai proyek pertama Anda'}
              desc={
                filtering
                  ? 'Coba kata kunci lain atau reset filter di atas.'
                  : 'Buat proyek, pecah jadi tugas kecil, dan catat progres harian di logbook.'
              }
              action={
                <>
                  {filtering ? (
                    <button type="button" onClick={resetFilters} className="btn-secondary px-4 py-2 text-[12.5px]">
                      Reset filter
                    </button>
                  ) : null}
                  <button type="button" onClick={onNewProject} className="btn-primary px-4 py-2 text-[12.5px]">
                    Buat proyek
                  </button>
                </>
              }
            />
          ) : (
            <>
              <p className="mono text-[11px] text-stone-400">
                {list.length} dari {projects.length} proyek
              </p>
              <div className="stagger grid gap-3 md:grid-cols-2">
                {list.map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onOpen={(proj) => onOpenProject(proj.id)}
                    onEdit={onEdit}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right rail */}
        <div className="space-y-3">
          <Card className={`p-4 ${attention.length > 0 ? 'border-rose-200' : ''}`}>
            <SectionHead
              title="Perlu perhatian"
              desc={attention.length > 0 ? `${attention.length} proyek lewat deadline` : 'Semua sesuai jadwal'}
            />
            {attention.length === 0 ? (
              <p className="mt-3 rounded-[10px] bg-emerald-50 px-3 py-2.5 text-[12.5px] font-medium text-emerald-800">
                Aman — tidak ada yang terlambat.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {attention.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => onOpenProject(p.id)}
                      className="group flex w-full items-center gap-2.5 rounded-[10px] border border-rose-100 bg-rose-50/50 px-3 py-2.5 text-left transition-colors hover:border-rose-300"
                    >
                      <CalendarClock className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-stone-900">
                          {p.title}
                        </span>
                        <span className="tnum mt-0.5 block text-[11px] font-medium text-rose-700">
                          Terlambat • {p.progress_percent}%
                        </span>
                      </span>
                      <ArrowRight
                        className="h-3.5 w-3.5 shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-rose-600"
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => onNavigate('deadlines')}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-indigo-700 hover:text-indigo-800"
            >
              Lihat semua tenggat <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </Card>

          <Card className="p-4">
            <SectionHead title="Distribusi status" desc="Komposisi portfolio" />
            <div className="mt-3">
              <StatusDonut data={dist} total={projects.length} />
            </div>
          </Card>

          <Card className="p-4">
            <SectionHead
              title="Aktivitas 7 hari"
              desc="Catatan logbook per hari"
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('activity')}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  Feed <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              }
            />
            <div className="mt-3">
              <ActivityBars days={week} />
            </div>
          </Card>

          {recentLogs.length > 0 ? (
            <Card className="p-4">
              <SectionHead title="Terakhir dicatat" desc="Logbook paling baru" />
              <ul className="mt-3 space-y-2">
                {recentLogs.slice(0, 3).map((l) => {
                  const meta = getLogTypeMeta(l.log_type);
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => onOpenProject(l.project_id)}
                        className="block w-full rounded-[10px] border border-stone-200 px-3 py-2.5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40"
                      >
                        <span className="block truncate text-[12.5px] font-semibold text-stone-900">
                          {l.title}
                        </span>
                        <span className={`mt-1.5 inline-block rounded-full border border-stone-200 px-2 py-0.5 text-[10.5px] font-semibold ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
