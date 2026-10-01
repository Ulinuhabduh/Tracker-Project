'use client';

import React from 'react';
import { ArrowLeft, CalendarDays, Copy, Ellipsis, ListChecks, NotebookPen, Pencil, Trash2 } from 'lucide-react';
import type {
  LogbookEntry,
  Milestone,
  Project,
  ProjectDetailData,
  ProjectStatus,
  Task,
} from '@/lib/types';
import { formatDate, renderDescriptionToHtml } from '@/lib/utils';
import { dueLabel } from '@/lib/dashboard-utils';
import { Card, PriorityBadge, ProgressBar, StatusBadge } from './ui';
import { TaskManager } from './TaskManager';
import { LogbookSection } from './LogbookSection';

interface ProjectDetailProps {
  projectData: ProjectDetailData;
  onBack: () => void;
  onEditProject: (p: Project) => void;
  onDuplicate: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onStatusChange: (id: string, s: ProjectStatus) => void;
  onSaveTask: (t: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onSaveMilestone: (m: Partial<Milestone>) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
  onSaveLogbook: (l: Partial<LogbookEntry>) => Promise<void>;
  onDeleteLogbook: (id: string) => Promise<void>;
}

type Tab = 'tasks' | 'logbook' | 'overview';

export function ProjectDetail({
  projectData,
  onBack,
  onEditProject,
  onDuplicate,
  onDeleteProject,
  onStatusChange,
  onSaveTask,
  onDeleteTask,
  onSaveMilestone,
  onDeleteMilestone,
  onSaveLogbook,
  onDeleteLogbook,
}: ProjectDetailProps) {
  const [tab, setTab] = React.useState<Tab>('tasks');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [descOpen, setDescOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const doneTasks = projectData.tasks.filter((t) => t.status === 'done').length;
  const doneMs = projectData.milestones.filter((m) => m.is_completed).length;

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  const tabs: { key: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { key: 'tasks', label: 'Tugas', count: projectData.tasks.length, icon: <ListChecks className="h-3.5 w-3.5" aria-hidden="true" /> },
    { key: 'logbook', label: 'Logbook', count: projectData.logbooks.length, icon: <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" /> },
    { key: 'overview', label: 'Ringkasan', icon: <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> },
  ];

  const hasDesc = !!projectData.description?.trim();

  return (
    <div className="animate-fade-up space-y-3">
      {/* Toolbar ringkas: navigasi + tab + aksi dalam satu bar sticky */}
      <div className="sticky top-[68px] z-20 -mx-1 px-1 py-1.5">
        <div className="card flex items-center gap-1 px-1.5 py-1.5 shadow-[0_8px_24px_-12px_rgb(28_25_23/0.2)]">
          <button
            type="button"
            onClick={onBack}
            className="icon-btn shrink-0 p-2"
            aria-label="Kembali ke semua proyek"
            title="Semua proyek"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-bold text-stone-900">{projectData.title}</p>
            <p className="tnum truncate text-[11px] text-stone-500">
              {doneTasks}/{projectData.tasks.length} tugas • {projectData.progress_percent}%
            </p>
          </div>

          <div className="hidden items-center gap-0.5 md:flex" role="tablist" aria-label="Bagian proyek">
            {tabs.map((t) => {
              const on = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                    on ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {typeof t.count === 'number' ? (
                    <span className={`tnum text-[10.5px] font-bold ${on ? 'text-stone-300' : 'text-stone-400'}`}>
                      {t.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <label htmlFor="status-proyek" className="sr-only">
            Ubah status proyek
          </label>
          <select
            id="status-proyek"
            value={projectData.status}
            onChange={(e) => onStatusChange(projectData.id, e.target.value as ProjectStatus)}
            className="field w-auto shrink-0 px-2 py-1.5 text-[11.5px]"
          >
            <option value="planning">Rencana</option>
            <option value="in_progress">Berjalan</option>
            <option value="on_hold">Tunda</option>
            <option value="completed">Selesai</option>
          </select>

          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="icon-btn p-2"
              aria-label={`Opsi proyek ${projectData.title}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <Ellipsis className="h-4 w-4" aria-hidden="true" />
            </button>
            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-1 w-44 animate-scale-in rounded-xl border border-stone-200 bg-white p-1 shadow-xl"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onEditProject(projectData);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-stone-700 hover:bg-stone-100"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Ubah detail
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(projectData.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-stone-700 hover:bg-stone-100"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Duplikat
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteProject(projectData.id);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Hapus
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab mobile: tetap satu bar, tapi di bawah toolbar */}
        <div
          className="scrollbar-none card mt-1.5 flex items-center gap-0.5 overflow-x-auto p-1 md:hidden"
          role="tablist"
          aria-label="Bagian proyek"
        >
          {tabs.map((t) => {
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors ${
                  on ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                {t.icon}
                {t.label}
                {typeof t.count === 'number' ? (
                  <span className={`tnum text-[10.5px] font-bold ${on ? 'text-stone-300' : 'text-stone-400'}`}>
                    {t.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ringkasan hero: 2 kolom di desktop, padat */}
      <Card className="p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="chip">{projectData.category}</span>
              <PriorityBadge priority={projectData.priority} />
              <StatusBadge status={projectData.status} />
              {projectData.tags?.slice(0, 3).map((t) => (
                <span key={t} className="chip mono">
                  #{t}
                </span>
              ))}
              {(projectData.tags?.length ?? 0) > 3 ? (
                <span className="mono text-[11px] text-stone-400">+{projectData.tags.length - 3}</span>
              ) : null}
            </div>
            <h1 className="mt-2 text-balance text-[18px] font-bold leading-tight tracking-tight text-stone-900 sm:text-[20px]">
              {projectData.title}
            </h1>
            {hasDesc ? (
              <div>
                <div
                  className={`mt-1 max-w-3xl text-[12.5px] leading-relaxed text-stone-500 ${descOpen ? '' : 'line-clamp-2'}`}
                  dangerouslySetInnerHTML={{ __html: renderDescriptionToHtml(projectData.description) }}
                />
                <button
                  type="button"
                  onClick={() => setDescOpen((v) => !v)}
                  className="mt-0.5 text-[11.5px] font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  {descOpen ? 'Tutup' : 'Selengkapnya'}
                </button>
              </div>
            ) : (
              <p className="mt-1 text-[12.5px] text-stone-400">Belum ada deskripsi.</p>
            )}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-stone-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                {formatDate(projectData.start_date)} →{' '}
                <strong className="font-semibold text-stone-700">{formatDate(projectData.due_date)}</strong>
              </span>
              <span className="font-semibold text-stone-700">{dueLabel(projectData.due_date)}</span>
            </p>
          </div>
          <div className="h-fit rounded-xl border border-stone-200 bg-stone-50 p-3 lg:sticky lg:top-[132px]">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-stone-500">
                Progres
              </span>
              <span className="tnum text-[16px] font-bold text-stone-900">
                {projectData.progress_percent}%
              </span>
            </div>
            <ProgressBar value={projectData.progress_percent} className="mt-1.5" />
            <dl className="tnum mt-2 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-lg bg-white px-1 py-1.5">
                <dt className="text-[9.5px] font-bold uppercase tracking-wide text-stone-400">Tugas</dt>
                <dd className="text-[12px] font-bold text-stone-800">{doneTasks}/{projectData.tasks.length}</dd>
              </div>
              <div className="rounded-lg bg-white px-1 py-1.5">
                <dt className="text-[9.5px] font-bold uppercase tracking-wide text-stone-400">Milestone</dt>
                <dd className="text-[12px] font-bold text-violet-700">{doneMs}/{projectData.milestones.length}</dd>
              </div>
              <div className="rounded-lg bg-white px-1 py-1.5">
                <dt className="text-[9.5px] font-bold uppercase tracking-wide text-stone-400">Log</dt>
                <dd className="text-[12px] font-bold text-sky-700">{projectData.logbooks.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      {tab === 'tasks' ? (
        <TaskManager
          projectId={projectData.id}
          tasks={projectData.tasks}
          milestones={projectData.milestones}
          onSaveTask={onSaveTask}
          onDeleteTask={onDeleteTask}
          onSaveMilestone={onSaveMilestone}
          onDeleteMilestone={onDeleteMilestone}
        />
      ) : null}

      {tab === 'logbook' ? (
        <LogbookSection
          projectId={projectData.id}
          project={projectData}
          logbooks={projectData.logbooks}
          onSaveLogbook={onSaveLogbook}
          onDeleteLogbook={onDeleteLogbook}
        />
      ) : null}

      {tab === 'overview' ? (
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <h3 className="text-[13px] font-bold text-stone-900">Tag & teknologi</h3>
            {projectData.tags?.length ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {projectData.tags.map((t) => (
                  <span key={t} className="chip mono">
                    #{t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-stone-500">Belum ada tag.</p>
            )}
          </Card>
          <Card className="p-4">
            <h3 className="text-[13px] font-bold text-stone-900">Waktu</h3>
            <dl className="mt-2.5 space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-stone-500">Dibuat</dt>
                <dd className="mono text-stone-700">{formatDate(projectData.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Diperbarui</dt>
                <dd className="mono text-stone-700">{formatDate(projectData.updated_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Deadline</dt>
                <dd className="mono font-semibold text-stone-800">{formatDate(projectData.due_date)}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-4">
            <h3 className="text-[13px] font-bold text-stone-900">Catatan</h3>
            <p className="mt-2 text-[11.5px] leading-relaxed text-stone-500">
              Progres dihitung otomatis dari tugas yang selesai. Centang tugas untuk memperbarui angka.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
