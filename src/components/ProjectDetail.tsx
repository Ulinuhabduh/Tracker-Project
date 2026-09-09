'use client';

import React from 'react';
import { ArrowLeft, CalendarDays, Copy, ListChecks, NotebookPen, Pencil, Trash2 } from 'lucide-react';
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
  const doneTasks = projectData.tasks.filter((t) => t.status === 'done').length;
  const doneMs = projectData.milestones.filter((m) => m.is_completed).length;

  const tabs: { key: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
    { key: 'tasks', label: 'Tugas', count: projectData.tasks.length, icon: <ListChecks className="h-4 w-4" aria-hidden="true" /> },
    { key: 'logbook', label: 'Logbook', count: projectData.logbooks.length, icon: <NotebookPen className="h-4 w-4" aria-hidden="true" /> },
    { key: 'overview', label: 'Ringkasan', icon: <CalendarDays className="h-4 w-4" aria-hidden="true" /> },
  ];

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="btn-secondary px-3 py-2 text-[12.5px]">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Semua proyek
        </button>
        <div className="flex items-center gap-1.5">
          <label htmlFor="status-proyek" className="sr-only">
            Ubah status proyek
          </label>
          <select
            id="status-proyek"
            value={projectData.status}
            onChange={(e) => onStatusChange(projectData.id, e.target.value as ProjectStatus)}
            className="field w-auto px-2.5 py-2 text-[12px]"
          >
            <option value="planning">Perencanaan</option>
            <option value="in_progress">Berjalan</option>
            <option value="on_hold">Tertunda</option>
            <option value="completed">Selesai</option>
          </select>
          <button
            type="button"
            onClick={() => onEditProject(projectData)}
            className="btn-secondary px-3 py-2 text-[12.5px]"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ubah</span>
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(projectData.id)}
            className="btn-secondary px-2.5 py-2"
            aria-label={`Duplikat proyek ${projectData.title}`}
            title="Duplikat proyek"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteProject(projectData.id)}
            className="btn-secondary px-2.5 py-2 text-rose-700 hover:border-rose-300 hover:bg-rose-50"
            aria-label={`Hapus proyek ${projectData.title}`}
            title="Hapus proyek"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="chip">{projectData.category}</span>
          <PriorityBadge priority={projectData.priority} />
          <StatusBadge status={projectData.status} />
        </div>
        <h1 className="mt-3 text-balance text-[20px] font-bold leading-tight tracking-tight text-stone-900 sm:text-[24px]">
          {projectData.title}
        </h1>
        {projectData.description?.trim() ? (
          <div
            className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-stone-500"
            dangerouslySetInnerHTML={{ __html: renderDescriptionToHtml(projectData.description) }}
          />
        ) : (
          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-stone-400">
            Belum ada deskripsi.
          </p>
        )}
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-stone-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(projectData.start_date)} → <strong className="font-semibold text-stone-700">{formatDate(projectData.due_date)}</strong>
          </span>
          <span className="font-semibold text-stone-700">{dueLabel(projectData.due_date)}</span>
        </p>
        <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">
              Progres keseluruhan
            </span>
            <span className="tnum text-[18px] font-bold text-stone-900">
              {projectData.progress_percent}%
            </span>
          </div>
          <ProgressBar value={projectData.progress_percent} className="mt-2" />
          <p className="tnum mt-2 text-[11.5px] text-stone-500">
            {doneTasks}/{projectData.tasks.length} tugas • {doneMs}/{projectData.milestones.length} milestone • {projectData.logbooks.length} log
          </p>
        </div>
      </Card>

      <div
        className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-stone-200 bg-white p-1"
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
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors ${
                on ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {t.icon}
              {t.label}
              {typeof t.count === 'number' ? (
                <span className={`tnum rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${on ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'}`}>
                  {t.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

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
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-[13.5px] font-bold text-stone-900">Tag & teknologi</h3>
            {projectData.tags?.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {projectData.tags.map((t) => (
                  <span key={t} className="chip mono">
                    #{t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12.5px] text-stone-500">Belum ada tag.</p>
            )}
            <dl className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-[12px]">
              <div className="flex justify-between">
                <dt className="text-stone-500">Dibuat</dt>
                <dd className="mono text-stone-700">{formatDate(projectData.created_at)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Diperbarui</dt>
                <dd className="mono text-stone-700">{formatDate(projectData.updated_at)}</dd>
              </div>
            </dl>
          </Card>
          <Card className="p-5">
            <h3 className="text-[13.5px] font-bold text-stone-900">Angka penting</h3>
            <ul className="mt-3 space-y-2 text-[12.5px]">
              <li className="flex items-center justify-between rounded-[10px] bg-stone-50 px-3 py-2.5">
                <span className="text-stone-500">Tugas selesai</span>
                <span className="tnum font-bold text-stone-900">{doneTasks}/{projectData.tasks.length}</span>
              </li>
              <li className="flex items-center justify-between rounded-[10px] bg-stone-50 px-3 py-2.5">
                <span className="text-stone-500">Milestone tercapai</span>
                <span className="tnum font-bold text-violet-700">{doneMs}/{projectData.milestones.length}</span>
              </li>
              <li className="flex items-center justify-between rounded-[10px] bg-stone-50 px-3 py-2.5">
                <span className="text-stone-500">Logbook tercatat</span>
                <span className="tnum font-bold text-sky-700">{projectData.logbooks.length} entri</span>
              </li>
            </ul>
            <p className="mt-3 text-[11.5px] leading-relaxed text-stone-500">
              Progres dihitung otomatis dari tugas yang selesai. Centang tugas untuk memperbarui angka.
            </p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
