'use client';

import React from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Plus, 
  Trash2, 
  Flag, 
  Calendar, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Task, Milestone, TaskStatus, TaskPriority } from '@/lib/types';
import { formatDate, getDaysRemaining } from '@/lib/utils';

interface TaskManagerProps {
  projectId: string;
  tasks: Task[];
  milestones: Milestone[];
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onSaveMilestone: (ms: Partial<Milestone>) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
}

export function TaskManager({
  projectId,
  tasks,
  milestones,
  onSaveTask,
  onDeleteTask,
  onSaveMilestone,
  onDeleteMilestone,
}: TaskManagerProps) {
  const [taskTitle, setTaskTitle] = React.useState('');
  const [taskPriority, setTaskPriority] = React.useState<TaskPriority>('medium');
  const [taskMilestoneId, setTaskMilestoneId] = React.useState<string>('');
  const [taskDueDate, setTaskDueDate] = React.useState('');
  const [isAddingTask, setIsAddingTask] = React.useState(false);

  const [msTitle, setMsTitle] = React.useState('');
  const [msDueDate, setMsDueDate] = React.useState('');
  const [isAddingMs, setIsAddingMs] = React.useState(false);

  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [selectedMilestone, setSelectedMilestone] = React.useState<string>('all');

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleTaskStatus = async (task: Task) => {
    let nextStatus: TaskStatus = 'in_progress';
    if (task.status === 'todo') nextStatus = 'in_progress';
    else if (task.status === 'in_progress') nextStatus = 'done';
    else if (task.status === 'done') nextStatus = 'todo';

    if (nextStatus === 'done' && completedCount + 1 === totalCount) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1', '#38bdf8', '#fbbf24'],
        });
      } catch (e) {
        // ignore
      }
    }

    await onSaveTask({
      id: task.id,
      project_id: projectId,
      status: nextStatus,
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await onSaveTask({
      project_id: projectId,
      title: taskTitle.trim(),
      priority: taskPriority,
      milestone_id: taskMilestoneId || null,
      due_date: taskDueDate || undefined,
      status: 'todo',
    });

    setTaskTitle('');
    setTaskDueDate('');
    setIsAddingTask(false);
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msTitle.trim()) return;

    await onSaveMilestone({
      project_id: projectId,
      title: msTitle.trim(),
      due_date: msDueDate || undefined,
      is_completed: false,
    });

    setMsTitle('');
    setMsDueDate('');
    setIsAddingMs(false);
  };

  const handleToggleMilestone = async (ms: Milestone) => {
    await onSaveMilestone({
      id: ms.id,
      project_id: projectId,
      is_completed: !ms.is_completed,
    });
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (selectedMilestone !== 'all') {
      if (selectedMilestone === 'none' && t.milestone_id) return false;
      if (selectedMilestone !== 'none' && t.milestone_id !== selectedMilestone) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Progress & Milestone Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {/* Progress Card */}
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider font-mono">
              Kalkulasi Progres
            </span>
            <span className="text-sm font-bold font-mono text-emerald-400">
              {progressPercent}%
            </span>
          </div>

          <div className="mt-2.5 sm:mt-3 w-full bg-zinc-800 rounded-full h-2 sm:h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-3 sm:mt-4 flex items-center justify-between text-[11px] sm:text-xs text-zinc-400">
            <span>{completedCount} / {totalCount} task selesai</span>
            <span className="font-mono text-zinc-500">
              {totalCount - completedCount} tersisa
            </span>
          </div>
        </div>

        {/* Milestones Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-4 sm:p-5 border border-zinc-800">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Milestones Capaian ({milestones.length})
              </h3>
            </div>
            {!isAddingMs && (
              <button
                onClick={() => setIsAddingMs(true)}
                className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Milestone</span>
              </button>
            )}
          </div>

          {/* New Milestone Form */}
          {isAddingMs && (
            <form onSubmit={handleCreateMilestone} className="mb-3.5 p-3 rounded-xl bg-zinc-900 border border-zinc-800 animate-fade-in space-y-2">
              <input
                type="text"
                required
                placeholder="Nama milestone..."
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-xs focus:outline-none focus:border-purple-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={msDueDate}
                  onChange={(e) => setMsDueDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-zinc-700 bg-zinc-950 text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setIsAddingMs(false)}
                  className="px-3 py-1 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Simpan
                </button>
              </div>
            </form>
          )}

          {/* Milestones List */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {milestones.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-1">
                Belum ada milestone capaian. Tambahkan milestone untuk membagi fase proyek.
              </p>
            ) : (
              milestones.map((ms) => (
                <div
                  key={ms.id}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs transition-all ${
                    ms.is_completed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleMilestone(ms)}
                    className="hover:scale-110 transition-transform p-0.5"
                  >
                    {ms.is_completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-zinc-500" />
                    )}
                  </button>
                  <span className={ms.is_completed ? 'line-through opacity-80 font-medium truncate max-w-[140px] sm:max-w-none' : 'font-medium truncate max-w-[140px] sm:max-w-none'}>
                    {ms.title}
                  </span>
                  {ms.due_date && (
                    <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                      • {formatDate(ms.due_date)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteMilestone(ms.id)}
                    className="text-zinc-500 hover:text-rose-400 ml-1 p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-3.5 sm:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Tugas & Checklist
            </h3>
            <span className="px-2 py-0.2 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400">
              {filteredTasks.length}
            </span>
          </div>

          {!isAddingTask && (
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Tugas</span>
            </button>
          )}
        </div>

        {/* New Task Inline Form */}
        {isAddingTask && (
          <form
            onSubmit={handleCreateTask}
            className="glass-card rounded-2xl p-4 sm:p-5 border border-indigo-500/40 bg-zinc-950/80 animate-fade-in space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider font-mono">
                Tugas Baru
              </span>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              required
              placeholder="Apa yang perlu diselesaikan? (mis: Setup API Edge Handler)"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Prioritas</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Milestone</label>
                <select
                  value={taskMilestoneId}
                  onChange={(e) => setTaskMilestoneId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Tanpa Milestone</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Tenggat Waktu</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-xs"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Tambahkan Tugas
              </button>
            </div>
          </form>
        )}

        {/* Task Filter Tabs (Horizontally scrollable on mobile) */}
        <div className="flex items-center justify-between gap-2 text-xs border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 text-[11px] sm:text-xs ${
                filterStatus === 'all'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Semua ({tasks.length})
            </button>
            <button
              onClick={() => setFilterStatus('todo')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 text-[11px] sm:text-xs ${
                filterStatus === 'todo'
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              To Do
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 text-[11px] sm:text-xs ${
                filterStatus === 'in_progress'
                  ? 'bg-sky-500/20 text-sky-300 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterStatus('done')}
              className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all shrink-0 text-[11px] sm:text-xs ${
                filterStatus === 'done'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Done
            </button>
          </div>

          {milestones.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
              <span className="hidden sm:inline">Milestone:</span>
              <select
                value={selectedMilestone}
                onChange={(e) => setSelectedMilestone(e.target.value)}
                className="px-2 py-1 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs focus:outline-none"
              >
                <option value="all">Semua</option>
                <option value="none">Tanpa Milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tasks Checklist */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="p-6 sm:p-8 text-center glass-card rounded-xl border border-zinc-800 text-xs text-zinc-500">
              Belum ada tugas yang cocok dengan filter ini.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const matchedMilestone = milestones.find((m) => m.id === t.milestone_id);
              const deadline = getDaysRemaining(t.due_date);

              return (
                <div
                  key={t.id}
                  className={`flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                    t.status === 'done'
                      ? 'bg-zinc-950/40 border-zinc-850 opacity-75'
                      : 'glass-card border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTaskStatus(t)}
                      className="shrink-0 transition-transform active:scale-90 mt-0.5 sm:mt-0 p-0.5"
                      title="Ubah status"
                    >
                      {t.status === 'done' ? (
                        <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-400" />
                      ) : t.status === 'in_progress' ? (
                        <Clock className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-sky-400 animate-pulse" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-zinc-500 hover:text-zinc-300" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <span
                        className={`text-xs sm:text-sm font-medium block leading-snug ${
                          t.status === 'done'
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-200'
                        }`}
                      >
                        {t.title}
                      </span>

                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-[11px]">
                        <span
                          className={`font-mono uppercase text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            t.status === 'done'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : t.status === 'in_progress'
                              ? 'text-sky-400 bg-sky-500/10'
                              : 'text-zinc-400 bg-zinc-800'
                          }`}
                        >
                          {t.status === 'done'
                            ? 'Done'
                            : t.status === 'in_progress'
                            ? 'In Progress'
                            : 'To Do'}
                        </span>

                        <span
                          className={`font-mono text-[10px] ${
                            t.priority === 'high'
                              ? 'text-rose-400 font-semibold'
                              : t.priority === 'medium'
                              ? 'text-amber-400'
                              : 'text-zinc-400'
                          }`}
                        >
                          • {t.priority.toUpperCase()}
                        </span>

                        {matchedMilestone && (
                          <span className="text-purple-400 font-mono text-[10px] flex items-center gap-0.5 truncate max-w-[120px] sm:max-w-none">
                            • <Flag className="h-2.5 w-2.5 inline shrink-0" /> {matchedMilestone.title}
                          </span>
                        )}

                        {t.due_date && (
                          <span className={`text-[10px] font-mono ${deadline.isOverdue ? 'text-rose-400' : 'text-zinc-400'}`}>
                            • {deadline.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(t.id)}
                    className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                    title="Hapus Task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
