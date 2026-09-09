'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  CircleCheck,
  Columns,
  Flag,
  List,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { Milestone, Task, TaskPriority, TaskStatus } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { dueLabel } from '@/lib/dashboard-utils';
import { Card, ProgressBar, SectionHead } from './ui';

interface TaskManagerProps {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
  onSaveTask: (t: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onSaveMilestone: (m: Partial<Milestone>) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
}

const NEXT: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'Berjalan',
  done: 'Selesai',
};

export function TaskManager({
  projectId,
  tasks,
  milestones,
  onSaveTask,
  onDeleteTask,
  onSaveMilestone,
  onDeleteMilestone,
}: TaskManagerProps) {
  const [mode, setMode] = React.useState<'list' | 'board'>('list');
  const [title, setTitle] = React.useState('');
  const [priority, setPriority] = React.useState<TaskPriority>('medium');
  const [milestoneId, setMilestoneId] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [adding, setAdding] = React.useState(false);

  const [msTitle, setMsTitle] = React.useState('');
  const [msDue, setMsDue] = React.useState('');
  const [addingMs, setAddingMs] = React.useState(false);

  const [filter, setFilter] = React.useState('all');
  const [msFilter, setMsFilter] = React.useState('all');

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const toggle = async (task: Task) => {
    const next = NEXT[task.status];
    if (next === 'done' && doneCount + 1 === tasks.length && tasks.length > 0) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10b981', '#4f46e5', '#0ea5e9', '#f59e0b'],
        });
      } catch {
        /* abaikan */
      }
    }
    await onSaveTask({ id: task.id, project_id: projectId, status: next });
  };

  const move = async (task: Task, dir: -1 | 1) => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'done'];
    const next = order[Math.min(2, Math.max(0, order.indexOf(task.status) + dir))];
    if (next !== task.status) await onSaveTask({ id: task.id, project_id: projectId, status: next });
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onSaveTask({
      project_id: projectId,
      title: title.trim(),
      priority,
      milestone_id: milestoneId || null,
      due_date: dueDate || undefined,
      status: 'todo',
    });
    setTitle('');
    setDueDate('');
    setMilestoneId('');
    setAdding(false);
  };

  const createMs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;
    await onSaveMilestone({
      project_id: projectId,
      title: msTitle.trim(),
      due_date: msDue || undefined,
      is_completed: false,
    });
    setMsTitle('');
    setMsDue('');
    setAddingMs(false);
  };

  const filtered = tasks.filter((t) => {
    if (filter !== 'all' && t.status !== filter) return false;
    if (msFilter !== 'all') {
      if (msFilter === 'none') return !t.milestone_id;
      return t.milestone_id === msFilter;
    }
    return true;
  });

  const milestoneName = (id?: string | null) => milestones.find((m) => m.id === id)?.title;

  const boardCols: { key: TaskStatus; tint: string }[] = [
    { key: 'todo', tint: 'bg-stone-100 text-stone-600' },
    { key: 'in_progress', tint: 'bg-sky-100 text-sky-800' },
    { key: 'done', tint: 'bg-emerald-100 text-emerald-800' },
  ];

  return (
    <div className="space-y-3">
      {/* Milestones */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <SectionHead title={`Milestone (${milestones.length})`} desc="Tahapan besar proyek" />
          {!addingMs ? (
            <button
              type="button"
              onClick={() => setAddingMs(true)}
              className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-violet-700 hover:text-violet-800"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Tambah
            </button>
          ) : null}
        </div>
        {addingMs ? (
          <form onSubmit={createMs} className="mt-3 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <label htmlFor="nama-milestone" className="sr-only">
              Nama milestone
            </label>
            <input
              id="nama-milestone"
              autoComplete="off"
              required
              placeholder="Nama milestone, mis: Beta launch…"
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              className="field px-3 py-2 text-[13px]"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="tgl-milestone" className="sr-only">
                Tanggal milestone
              </label>
              <input
                id="tgl-milestone"
                type="date"
                value={msDue}
                onChange={(e) => setMsDue(e.target.value)}
                className="field w-auto px-2.5 py-1.5 text-[12px]"
              />
              <span className="flex-1" />
              <button type="button" onClick={() => setAddingMs(false)} className="btn-secondary px-3 py-1.5 text-[12px]">
                Batal
              </button>
              <button type="submit" className="btn-primary px-3.5 py-1.5 text-[12px]">
                Simpan
              </button>
            </div>
          </form>
        ) : null}
        {milestones.length === 0 && !addingMs ? (
          <p className="mt-2 text-[12.5px] text-stone-500">
            Belum ada milestone. Pecah proyek jadi fase agar mudah dilacak.
          </p>
        ) : null}
        {milestones.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {milestones.map((m) => (
              <li
                key={m.id}
                className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-1 text-[12px] ${
                  m.is_completed
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-stone-200 bg-white text-stone-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSaveMilestone({ id: m.id, project_id: projectId, is_completed: !m.is_completed })
                  }
                  className="rounded-full transition-transform active:scale-90"
                  aria-label={m.is_completed ? `Batalkan milestone ${m.title}` : `Selesaikan milestone ${m.title}`}
                  aria-pressed={m.is_completed}
                >
                  {m.is_completed ? (
                    <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-stone-300" aria-hidden="true" />
                  )}
                </button>
                <span className={`max-w-[180px] truncate font-medium ${m.is_completed ? 'line-through opacity-70' : ''}`}>
                  {m.title}
                </span>
                {m.due_date ? (
                  <span className="mono hidden text-[10.5px] text-stone-400 sm:inline">{formatDate(m.due_date)}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDeleteMilestone(m.id)}
                  className="icon-btn p-1"
                  aria-label={`Hapus milestone ${m.title}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      {/* Tasks */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <SectionHead title={`Tugas (${tasks.length})`} desc={`${doneCount} selesai • ${progress}%`} />
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="flex items-center rounded-[10px] border border-stone-200 bg-stone-50 p-0.5" role="group" aria-label="Mode tampilan tugas">
              <button
                type="button"
                onClick={() => setMode('list')}
                className={`rounded-lg p-1.5 transition-colors ${mode === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                aria-label="Tampilan daftar"
                aria-pressed={mode === 'list'}
                title="Daftar"
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setMode('board')}
                className={`rounded-lg p-1.5 transition-colors ${mode === 'board' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400 hover:text-stone-700'}`}
                aria-label="Tampilan kanban"
                aria-pressed={mode === 'board'}
                title="Kanban"
              >
                <Columns className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {!adding ? (
              <button type="button" onClick={() => setAdding(true)} className="btn-primary px-3 py-2 text-[12.5px]">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> Tugas
              </button>
            ) : null}
          </div>
        </div>

        <ProgressBar value={progress} className="mt-3" />

        {adding ? (
          <form onSubmit={create} className="mt-3 space-y-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5">
            <label htmlFor="nama-tugas" className="sr-only">
              Nama tugas
            </label>
            <input
              id="nama-tugas"
              autoComplete="off"
              required
              placeholder="Apa yang perlu diselesaikan?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field px-3.5 py-2.5 text-[13px]"
            />
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <label htmlFor="prioritas-tugas" className="field-label">
                  Prioritas
                </label>
                <select
                  id="prioritas-tugas"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="field px-3 py-2 text-[12.5px]"
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </div>
              <div>
                <label htmlFor="milestone-tugas" className="field-label">
                  Milestone
                </label>
                <select
                  id="milestone-tugas"
                  value={milestoneId}
                  onChange={(e) => setMilestoneId(e.target.value)}
                  className="field px-3 py-2 text-[12.5px]"
                >
                  <option value="">Tanpa milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tgl-tugas" className="field-label">
                  Deadline
                </label>
                <input
                  id="tgl-tugas"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="field px-3 py-2 text-[12.5px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary px-3.5 py-2 text-[12.5px]">
                Batal
              </button>
              <button type="submit" className="btn-primary px-4 py-2 text-[12.5px]">
                Tambah tugas
              </button>
            </div>
          </form>
        ) : null}

        {/* Filters */}
        <div className="scrollbar-none mt-3 flex items-center gap-1 overflow-x-auto border-y border-stone-100 py-2" role="tablist" aria-label="Filter tugas">
          {[
            { key: 'all', label: `Semua (${tasks.length})` },
            { key: 'todo', label: 'To Do' },
            { key: 'in_progress', label: 'Berjalan' },
            { key: 'done', label: 'Selesai' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                filter === f.key ? 'bg-stone-900 font-semibold text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {f.label}
            </button>
          ))}
          {milestones.length > 0 ? (
            <>
              <label htmlFor="filter-ms" className="sr-only">
                Filter milestone
              </label>
              <select
                id="filter-ms"
                value={msFilter}
                onChange={(e) => setMsFilter(e.target.value)}
                className="field ml-auto w-auto shrink-0 px-2 py-1.5 text-[11.5px]"
              >
                <option value="all">Semua milestone</option>
                <option value="none">Tanpa milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-[12.5px] text-stone-500">
            {tasks.length === 0 ? 'Belum ada tugas. Tambahkan tugas pertama di atas.' : 'Tidak ada tugas yang cocok dengan filter.'}
          </p>
        ) : mode === 'list' ? (
          <ul className="divide-y divide-stone-100">
            {filtered.map((t) => {
              const ms = milestoneName(t.milestone_id);
              const done = t.status === 'done';
              return (
                <li key={t.id} className="group flex items-start gap-3 py-3">
                  <button
                    type="button"
                    onClick={() => toggle(t)}
                    className="mt-0.5 shrink-0 rounded-full transition-transform active:scale-90"
                    aria-label={done ? `Tandai belum selesai: ${t.title}` : `Tandai selesai: ${t.title}`}
                    aria-pressed={done}
                  >
                    {done ? (
                      <CircleCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                    ) : t.status === 'in_progress' ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-500" aria-hidden="true">
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                      </span>
                    ) : (
                      <Circle className="h-5 w-5 text-stone-300 hover:text-stone-500" aria-hidden="true" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13.5px] leading-snug ${done ? 'text-stone-400 line-through' : 'font-medium text-stone-800'}`}>
                      {t.title}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-stone-500">
                      <span className="font-semibold uppercase tracking-wide text-[10px]">
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span aria-hidden="true">•</span>
                      <span className="capitalize">{t.priority}</span>
                      {ms ? (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="inline-flex max-w-[160px] items-center gap-1 truncate text-violet-700">
                            <Flag className="h-2.5 w-2.5 shrink-0" aria-hidden="true" /> {ms}
                          </span>
                        </>
                      ) : null}
                      {t.due_date ? (
                        <>
                          <span aria-hidden="true">•</span>
                          <span className="font-medium">{dueLabel(t.due_date)}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteTask(t.id)}
                    className="icon-btn shrink-0 p-1.5 opacity-0 hover:text-rose-700 focus:opacity-100 group-hover:opacity-100"
                    aria-label={`Hapus tugas ${t.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="scrollbar-none -mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {boardCols.map((col) => {
              const items = filtered.filter((t) => t.status === col.key);
              return (
                <section
                  key={col.key}
                  aria-label={`Kolom ${STATUS_LABEL[col.key]}`}
                  className="w-60 shrink-0 rounded-xl border border-stone-200 bg-stone-50 p-2 sm:w-64"
                >
                  <header className="flex items-center gap-2 px-1.5 py-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${col.tint}`}>
                      {STATUS_LABEL[col.key]}
                    </span>
                    <span className="tnum text-[11px] text-stone-400">{items.length}</span>
                  </header>
                  <ul className="space-y-1.5">
                    {items.map((t) => (
                      <li key={t.id} className="rounded-[10px] border border-stone-200 bg-white p-2.5 shadow-sm">
                        <p className={`text-[12.5px] leading-snug ${t.status === 'done' ? 'text-stone-400 line-through' : 'font-medium text-stone-800'}`}>
                          {t.title}
                        </p>
                        {t.due_date ? (
                          <p className="mono mt-1 text-[10.5px] text-stone-500">{dueLabel(t.due_date)}</p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => move(t, -1)}
                              disabled={t.status === 'todo'}
                              className="icon-btn p-1 disabled:opacity-30"
                              aria-label={`Pindah mundur: ${t.title}`}
                            >
                              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggle(t)}
                              className="icon-btn p-1 hover:text-emerald-700"
                              aria-label={t.status === 'done' ? `Buka lagi: ${t.title}` : `Selesaikan: ${t.title}`}
                            >
                              {t.status === 'done' ? (
                                <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                              ) : (
                                <Check className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => move(t, 1)}
                              disabled={t.status === 'done'}
                              className="icon-btn p-1 disabled:opacity-30"
                              aria-label={`Pindah maju: ${t.title}`}
                            >
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => onDeleteTask(t.id)}
                            className="icon-btn p-1 hover:text-rose-700"
                            aria-label={`Hapus tugas ${t.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    ))}
                    {items.length === 0 ? (
                      <li className="rounded-[10px] border border-dashed border-stone-200 px-3 py-5 text-center text-[11.5px] text-stone-400">
                        Kosong
                      </li>
                    ) : null}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
