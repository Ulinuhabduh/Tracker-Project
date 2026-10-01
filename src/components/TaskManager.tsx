'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  CircleCheck,
  Columns,
  Eye,
  Flag,
  List,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { Milestone, Subtask, Task, TaskComment, TaskPriority, TaskStatus } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/utils';
import { dueLabel } from '@/lib/dashboard-utils';
import { Card, ProgressBar, SectionHead } from './ui';

interface TaskManagerProps {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
  subtasks: Subtask[];
  comments: TaskComment[];
  onSaveTask: (t: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onSaveMilestone: (m: Partial<Milestone>) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
  onSaveSubtask: (s: Partial<Subtask> & { task_id: string; project_id: string }) => Promise<void>;
  onDeleteSubtask: (id: string) => Promise<void>;
  onSaveComment: (taskId: string, content: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
  onBulkStatus: (ids: string[], status: TaskStatus) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
}

/** Workflow standar: To Do → Berjalan → Review → Selesai */
const NEXT: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'review',
  review: 'done',
  done: 'todo',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'Berjalan',
  review: 'Review',
  done: 'Selesai',
};

const ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export function TaskManager({
  projectId,
  tasks,
  milestones,
  subtasks,
  comments,
  onSaveTask,
  onDeleteTask,
  onSaveMilestone,
  onDeleteMilestone,
  onSaveSubtask,
  onDeleteSubtask,
  onSaveComment,
  onDeleteComment,
  onBulkStatus,
  onBulkDelete,
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

  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [dropCol, setDropCol] = React.useState<TaskStatus | null>(null);
  const [subInput, setSubInput] = React.useState('');
  const [commentInput, setCommentInput] = React.useState('');

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  const subsOf = (taskId: string) =>
    subtasks
      .filter((s) => s.task_id === taskId)
      .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at));
  const commentsOf = (taskId: string) =>
    comments
      .filter((c) => c.task_id === taskId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

  /** Definisi selesai: tugas dengan subtask terbuka tidak bisa ke Selesai begitu saja. */
  const advanceTo = async (task: Task, next: TaskStatus) => {
    if (next === 'done') {
      const open = subsOf(task.id).filter((s) => !s.is_done);
      if (open.length > 0) {
        if (
          !window.confirm(
            `“${task.title}” masih punya ${open.length} subtask belum selesai. Tandai semuanya selesai?`
          )
        )
          return;
        for (const s of open) {
          await onSaveSubtask({ id: s.id, task_id: task.id, project_id: projectId, is_done: true });
        }
      }
      if (doneCount + 1 === tasks.length && tasks.length > 0) {
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
    }
    await onSaveTask({ id: task.id, project_id: projectId, status: next });
  };

  const toggle = (task: Task) =>
    advanceTo(task, task.status === 'done' ? 'todo' : 'done');

  const move = async (task: Task, dir: -1 | 1) => {
    const next = ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(task.status) + dir))];
    if (next !== task.status) await advanceTo(task, next);
  };

  const onDropTo = async (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setDropCol(null);
    const id = e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t.id === id);
    if (task && task.status !== col) await advanceTo(task, col);
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

  const addSubtask = async (taskId: string) => {
    const v = subInput.trim();
    if (!v) return;
    await onSaveSubtask({ task_id: taskId, project_id: projectId, title: v });
    setSubInput('');
  };

  const addComment = async (taskId: string) => {
    const v = commentInput.trim();
    if (!v) return;
    await onSaveComment(taskId, v);
    setCommentInput('');
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const runBulkStatus = async (status: TaskStatus) => {
    if (selected.length === 0) return;
    await onBulkStatus(selected, status);
    setSelected([]);
  };

  const runBulkDelete = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Hapus ${selected.length} tugas terpilih?`)) return;
    await onBulkDelete(selected);
    setSelected([]);
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
    { key: 'review', tint: 'bg-amber-100 text-amber-800' },
    { key: 'done', tint: 'bg-emerald-100 text-emerald-800' },
  ];

  const statusIcon = (t: Task, done: boolean) => {
    if (done) return <CircleCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
    if (t.status === 'in_progress')
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-sky-500" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
        </span>
      );
    if (t.status === 'review') return <Eye className="h-5 w-5 text-amber-600" aria-hidden="true" />;
    return <Circle className="h-5 w-5 text-stone-300 hover:text-stone-500" aria-hidden="true" />;
  };

  const renderDetail = (t: Task) => {
    const subs = subsOf(t.id);
    const list = commentsOf(t.id);
    const subDone = subs.filter((s) => s.is_done).length;
    return (
      <div className="mt-2 border-t border-stone-100 pt-2">
        {/* Tahap pengerjaan — pindah antar To Do / Berjalan / Review / Selesai */}
        <div className="flex items-center gap-2">
          <label htmlFor={`tahap-${t.id}`} className="shrink-0 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">
            Tahap
          </label>
          <select
            id={`tahap-${t.id}`}
            value={t.status}
            onChange={(e) => advanceTo(t, e.target.value as TaskStatus)}
            className="field w-auto flex-1 px-2 py-1.5 text-[12px]"
          >
            {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Subtasks */}
        <p className="text-[10.5px] font-bold uppercase tracking-wide text-stone-400">
          Subtask {subs.length > 0 ? `${subDone}/${subs.length}` : ''}
        </p>
        {subs.length > 0 ? (
          <ul className="mt-1 space-y-1">
            {subs.map((s) => (
              <li key={s.id} className="group/sub flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onSaveSubtask({ id: s.id, task_id: t.id, project_id: projectId, is_done: !s.is_done })
                  }
                  className="shrink-0 rounded transition-transform active:scale-90"
                  aria-label={s.is_done ? `Buka lagi: ${s.title}` : `Selesaikan: ${s.title}`}
                  aria-pressed={s.is_done}
                >
                  {s.is_done ? (
                    <CircleCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="h-4 w-4 text-stone-300 hover:text-stone-500" aria-hidden="true" />
                  )}
                </button>
                <span className={`min-w-0 flex-1 truncate text-[12px] ${s.is_done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                  {s.title}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(s.id)}
                  className="icon-btn shrink-0 p-1 opacity-0 hover:text-rose-700 group-hover/sub:opacity-100"
                  aria-label={`Hapus subtask ${s.title}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-1.5 flex gap-1.5">
          <label htmlFor={`sub-${t.id}`} className="sr-only">
            Tambah subtask untuk {t.title}
          </label>
          <input
            id={`sub-${t.id}`}
            autoComplete="off"
            placeholder="+ Subtask…"
            value={expandedId === t.id ? subInput : ''}
            onChange={(e) => setSubInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSubtask(t.id);
              }
            }}
            className="field px-2.5 py-1.5 text-[12px]"
          />
          <button type="button" onClick={() => addSubtask(t.id)} className="btn-secondary shrink-0 px-2.5 py-1.5 text-[11.5px]">
            Tambah
          </button>
        </div>

        {/* Komentar */}
        <p className="mt-2.5 text-[10.5px] font-bold uppercase tracking-wide text-stone-400">
          Komentar {list.length > 0 ? `(${list.length})` : ''}
        </p>
        {list.length > 0 ? (
          <ul className="mt-1 space-y-1.5">
            {list.map((c) => (
              <li key={c.id} className="group/com rounded-lg bg-stone-50 px-2.5 py-1.5">
                <p className="flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-bold text-stone-700">{c.author_name}</span>
                  <span className="flex shrink-0 items-center gap-1">
                    <time className="text-[10px] text-stone-400" dateTime={c.created_at}>
                      {formatDateTime(c.created_at)}
                    </time>
                    <button
                      type="button"
                      onClick={() => onDeleteComment(c.id)}
                      className="icon-btn p-0.5 opacity-0 hover:text-rose-700 group-hover/com:opacity-100"
                      aria-label={`Hapus komentar ${c.author_name}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-stone-600">
                  {c.content}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-1.5 flex gap-1.5">
          <label htmlFor={`com-${t.id}`} className="sr-only">
            Tulis komentar untuk {t.title}
          </label>
          <input
            id={`com-${t.id}`}
            autoComplete="off"
            placeholder="Tulis komentar… (nama dari Profil perangkat)"
            value={expandedId === t.id ? commentInput : ''}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addComment(t.id);
              }
            }}
            className="field px-2.5 py-1.5 text-[12px]"
          />
          <button type="button" onClick={() => addComment(t.id)} className="btn-secondary shrink-0 px-2.5 py-1.5 text-[11.5px]">
            Kirim
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid items-start gap-3 xl:grid-cols-[264px_minmax(0,1fr)]">
      {/* Milestones — panel samping di desktop, atas di mobile */}
      <Card className="p-3.5 xl:sticky xl:top-[132px]">
        <div className="flex items-center justify-between gap-2">
          <SectionHead title={`Milestone (${milestones.length})`} desc="Tahapan besar" />
          {!addingMs ? (
            <button
              type="button"
              onClick={() => setAddingMs(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-semibold text-violet-700 hover:bg-violet-50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Tambah
            </button>
          ) : null}
        </div>
        {addingMs ? (
          <form onSubmit={createMs} className="mt-2 space-y-2 rounded-xl border border-stone-200 bg-stone-50 p-2.5">
            <label htmlFor="nama-milestone" className="sr-only">
              Nama milestone
            </label>
            <input
              id="nama-milestone"
              autoComplete="off"
              required
              placeholder="Nama milestone…"
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              className="field px-2.5 py-2 text-[12.5px]"
            />
            <div className="flex items-center gap-1.5">
              <label htmlFor="tgl-milestone" className="sr-only">
                Tanggal milestone
              </label>
              <input
                id="tgl-milestone"
                type="date"
                value={msDue}
                onChange={(e) => setMsDue(e.target.value)}
                className="field w-auto min-w-0 flex-1 px-2 py-1.5 text-[11.5px]"
              />
              <button type="button" onClick={() => setAddingMs(false)} className="btn-secondary shrink-0 px-2.5 py-1.5 text-[11.5px]">
                Batal
              </button>
              <button type="submit" className="btn-primary shrink-0 px-3 py-1.5 text-[11.5px]">
                Simpan
              </button>
            </div>
          </form>
        ) : null}
        {milestones.length === 0 && !addingMs ? (
          <p className="mt-2 text-[12px] text-stone-500">
            Belum ada milestone.
          </p>
        ) : null}
        {milestones.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5 xl:flex-col">
            {milestones.map((m) => (
              <li
                key={m.id}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-1 text-[12px] xl:w-full ${
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
                <span className={`min-w-0 flex-1 truncate font-medium ${m.is_completed ? 'line-through opacity-70' : ''}`}>
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
      <Card className="min-w-0 p-3.5 sm:p-4">
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
                title="Kanban (seret kartu antar kolom)"
              >
                <Columns className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {!adding ? (
              <button type="button" onClick={() => setAdding(true)} className="btn-primary px-3 py-2 text-[12px]">
                <Plus className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" /> Tugas
              </button>
            ) : null}
          </div>
        </div>

        <ProgressBar value={progress} className="mt-2.5" />

        {adding ? (
          <form onSubmit={create} className="mt-2.5 space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/50 p-3">
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
              className="field px-3 py-2 text-[13px]"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div>
                <label htmlFor="prioritas-tugas" className="field-label">
                  Prioritas
                </label>
                <select
                  id="prioritas-tugas"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="field px-2.5 py-2 text-[12px]"
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
                  className="field px-2.5 py-2 text-[12px]"
                >
                  <option value="">Tanpa milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="tgl-tugas" className="field-label">
                  Deadline
                </label>
                <input
                  id="tgl-tugas"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="field px-2.5 py-2 text-[12px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(false)} className="btn-secondary px-3 py-1.5 text-[12px]">
                Batal
              </button>
              <button type="submit" className="btn-primary px-4 py-1.5 text-[12px]">
                Tambah tugas
              </button>
            </div>
          </form>
        ) : null}

        {/* Bulk bar */}
        {selected.length > 0 ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 px-2.5 py-2">
            <span className="tnum text-[12px] font-bold text-indigo-900">{selected.length} dipilih</span>
            <span className="flex-1" />
            {(
              [
                { key: 'in_progress', label: 'Berjalan' },
                { key: 'review', label: 'Review' },
                { key: 'done', label: 'Selesai' },
              ] as { key: TaskStatus; label: string }[]
            ).map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => runBulkStatus(b.key)}
                className="rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-stone-700 shadow-sm transition-colors hover:bg-stone-900 hover:text-white"
              >
                {b.label}
              </button>
            ))}
            <button
              type="button"
              onClick={runBulkDelete}
              className="rounded-lg bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-rose-700 shadow-sm hover:bg-rose-600 hover:text-white"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={() => setSelected([])}
              className="rounded-lg px-2 py-1.5 text-[11.5px] text-stone-500 hover:text-stone-900"
            >
              Batal
            </button>
          </div>
        ) : null}

        {/* Filters — satu bar padat */}
        <div className="scrollbar-none mt-2.5 flex items-center gap-1 overflow-x-auto border-y border-stone-100 py-1.5" role="tablist" aria-label="Filter tugas">
          {[
            { key: 'all', label: `Semua (${tasks.length})` },
            { key: 'todo', label: 'To Do' },
            { key: 'in_progress', label: 'Berjalan' },
            { key: 'review', label: 'Review' },
            { key: 'done', label: 'Selesai' },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] transition-colors ${
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
                className="field ml-auto w-auto shrink-0 px-2 py-1 text-[11px]"
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
          <p className="py-6 text-center text-[12px] text-stone-500">
            {tasks.length === 0 ? 'Belum ada tugas. Tambahkan tugas pertama di atas.' : 'Tidak ada tugas yang cocok dengan filter.'}
          </p>
        ) : mode === 'list' ? (
          <ul className="mt-2.5 grid items-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((t) => {
              const ms = milestoneName(t.milestone_id);
              const done = t.status === 'done';
              const subs = subsOf(t.id);
              const subDone = subs.filter((s) => s.is_done).length;
              const comCount = commentsOf(t.id).length;
              const open = expandedId === t.id;
              return (
                <li
                  key={t.id}
                  className={`group rounded-xl border border-stone-200/80 bg-white px-2.5 py-2 transition-colors hover:border-stone-300 ${
                    done ? 'bg-stone-50/60' : ''
                  } ${selected.includes(t.id) ? 'border-indigo-400 ring-1 ring-indigo-300' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(t.id)}
                      onChange={() => toggleSelect(t.id)}
                      className="h-4 w-4 shrink-0 accent-indigo-600"
                      aria-label={`Pilih tugas ${t.title}`}
                    />
                    <button
                      type="button"
                      onClick={() => toggle(t)}
                      className="shrink-0 rounded-full transition-transform active:scale-90"
                      aria-label={done ? `Tandai belum selesai: ${t.title}` : `Tandai selesai: ${t.title}`}
                      aria-pressed={done}
                      title={done ? 'Tandai belum selesai' : 'Tandai selesai'}
                    >
                      {statusIcon(t, done)}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[13px] leading-snug ${done ? 'text-stone-400 line-through' : 'font-medium text-stone-800'}`}>
                        {t.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-x-1.5 gap-y-0 truncate text-[11px] text-stone-500">
                        <span className="shrink-0 font-semibold uppercase tracking-wide text-[9.5px]">
                          {STATUS_LABEL[t.status]}
                        </span>
                        {subs.length > 0 ? (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="shrink-0 font-medium text-indigo-700">{subDone}/{subs.length} sub</span>
                          </>
                        ) : null}
                        {comCount > 0 ? (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="inline-flex shrink-0 items-center gap-0.5 font-medium">
                              <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" /> {comCount}
                            </span>
                          </>
                        ) : null}
                        {ms ? (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="inline-flex min-w-0 items-center gap-1 truncate text-violet-700">
                              <Flag className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                              <span className="truncate">{ms}</span>
                            </span>
                          </>
                        ) : null}
                        {t.due_date ? (
                          <>
                            <span aria-hidden="true">•</span>
                            <span className="shrink-0 font-medium">{dueLabel(t.due_date)}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedId(open ? null : t.id);
                        setSubInput('');
                        setCommentInput('');
                      }}
                      className="icon-btn shrink-0 p-1.5"
                      aria-label={open ? `Tutup detail ${t.title}` : `Buka subtask & komentar ${t.title}`}
                      aria-expanded={open}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTask(t.id)}
                      className="icon-btn shrink-0 p-1.5 opacity-0 hover:text-rose-700 focus:opacity-100 group-hover:opacity-100"
                      aria-label={`Hapus tugas ${t.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  {open ? renderDetail(t) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="scrollbar-none -mx-1 mt-2.5 flex gap-2 overflow-x-auto px-1 pb-1">
            {boardCols.map((col) => {
              const items = filtered.filter((t) => t.status === col.key);
              return (
                <section
                  key={col.key}
                  aria-label={`Kolom ${STATUS_LABEL[col.key]}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropCol(col.key);
                  }}
                  onDragLeave={() => setDropCol((d) => (d === col.key ? null : d))}
                  onDrop={(e) => onDropTo(e, col.key)}
                  className={`w-56 shrink-0 rounded-xl border bg-stone-50 p-1.5 transition-colors ${
                    dropCol === col.key ? 'border-indigo-400 ring-2 ring-indigo-200' : 'border-stone-200'
                  }`}
                >
                  <header className="flex items-center gap-1.5 px-1 py-1">
                    <span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold ${col.tint}`}>
                      {STATUS_LABEL[col.key]}
                    </span>
                    <span className="tnum text-[10.5px] text-stone-400">{items.length}</span>
                  </header>
                  <ul className="min-h-[40px] space-y-1.5">
                    {items.map((t) => {
                      const subs = subsOf(t.id);
                      const subDone = subs.filter((s) => s.is_done).length;
                      const comCount = commentsOf(t.id).length;
                      return (
                        <li
                          key={t.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', t.id);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          className="cursor-grab rounded-[10px] border border-stone-200 bg-white p-2 shadow-sm active:cursor-grabbing"
                        >
                          <p className={`text-[12px] leading-snug ${t.status === 'done' ? 'text-stone-400 line-through' : 'font-medium text-stone-800'}`}>
                            {t.title}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-stone-500">
                            {subs.length > 0 ? <span className="font-medium text-indigo-700">{subDone}/{subs.length} sub</span> : null}
                            {comCount > 0 ? (
                              <span className="inline-flex items-center gap-0.5">
                                <MessageSquare className="h-2.5 w-2.5" aria-hidden="true" /> {comCount}
                              </span>
                            ) : null}
                            {t.due_date ? <span className="mono">{dueLabel(t.due_date)}</span> : null}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between">
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
                                aria-label={t.status === 'done' ? `Buka lagi: ${t.title}` : `Tandai selesai: ${t.title}`}
                                title={t.status === 'done' ? 'Buka lagi' : 'Tandai selesai'}
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
                      );
                    })}
                    {items.length === 0 ? (
                      <li className="rounded-[10px] border border-dashed border-stone-200 px-3 py-4 text-center text-[11px] text-stone-400">
                        Seret ke sini
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
