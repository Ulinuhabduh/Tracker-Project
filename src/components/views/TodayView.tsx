'use client';

import React from 'react';
import { AlarmClock, CalendarCheck2, Circle, CircleCheck, PartyPopper, Sun } from 'lucide-react';
import type { Project, Task } from '@/lib/types';
import { dueLabel, shortDate, type TodayGroups } from '@/lib/dashboard-utils';
import { Card, EmptyState } from '../ui';

interface TodayViewProps {
  groups: TodayGroups;
  onToggleTask: (task: Task) => void;
  onOpenProject: (id: string) => void;
  onNavigateDeadlines: () => void;
}

function TaskRow({
  task,
  project,
  onToggleTask,
  onOpenProject,
}: {
  task: Task;
  project?: Project;
  onToggleTask: (task: Task) => void;
  onOpenProject: (id: string) => void;
}) {
  const done = task.status === 'done';
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        onClick={() => onToggleTask(task)}
        className="mt-0.5 shrink-0 rounded-full transition-transform active:scale-90"
        aria-label={done ? `Tandai belum selesai: ${task.title}` : `Tandai selesai: ${task.title}`}
        aria-pressed={done}
      >
        {done ? (
          <CircleCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Circle className="h-5 w-5 text-stone-300 hover:text-indigo-600" aria-hidden="true" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-[13.5px] leading-snug ${done ? 'text-stone-400 line-through' : 'font-medium text-stone-800'}`}>
          {task.title}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-stone-500">
          {project ? (
            <button
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="max-w-[180px] truncate font-semibold text-indigo-700 hover:underline"
            >
              {project.title}
            </button>
          ) : null}
          <span aria-hidden="true">•</span>
          <span className={task.due_date ? 'font-medium text-stone-600' : ''}>
            {dueLabel(task.due_date)}
          </span>
          {task.priority === 'high' ? (
            <>
              <span aria-hidden="true">•</span>
              <span className="font-semibold text-amber-700">Prioritas tinggi</span>
            </>
          ) : null}
        </p>
      </div>
      {task.due_date ? (
        <span className="mono hidden shrink-0 rounded-md bg-stone-100 px-1.5 py-1 text-[10.5px] text-stone-500 sm:inline">
          {shortDate(task.due_date)}
        </span>
      ) : null}
    </li>
  );
}

export function TodayView({ groups, onToggleTask, onOpenProject, onNavigateDeadlines }: TodayViewProps) {
  const total = groups.overdue.length + groups.today.length + groups.upcoming.length;

  const sections = [
    {
      key: 'overdue',
      title: 'Terlambat',
      icon: <AlarmClock className="h-4 w-4 text-rose-600" aria-hidden="true" />,
      items: groups.overdue,
      tint: 'border-rose-200',
    },
    {
      key: 'today',
      title: 'Jatuh tempo hari ini',
      icon: <Sun className="h-4 w-4 text-indigo-600" aria-hidden="true" />,
      items: groups.today,
      tint: 'border-indigo-200',
    },
    {
      key: 'upcoming',
      title: '7 hari ke depan',
      icon: <CalendarCheck2 className="h-4 w-4 text-stone-500" aria-hidden="true" />,
      items: groups.upcoming,
      tint: '',
    },
  ];

  return (
    <div className="animate-fade-up mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-balance text-[22px] font-bold tracking-tight text-stone-900 sm:text-[26px]">
          Fokus hari ini
        </h1>
        <p className="mt-1 text-[13px] text-stone-500">
          {total === 0
            ? 'Tidak ada tugas berdeadline. Nikmati harimu.'
            : `${total} tugas butuh perhatian — selesaikan dari yang paling mendesak.`}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={<PartyPopper className="h-6 w-6" aria-hidden="true" />}
          title="Semua beres"
          desc="Tidak ada tugas yang terlambat atau jatuh tempo hari ini. Tambahkan deadline pada tugas agar muncul di sini."
          action={
            <button type="button" onClick={onNavigateDeadlines} className="btn-secondary px-4 py-2 text-[12.5px]">
              Lihat semua tenggat
            </button>
          }
        />
      ) : (
        sections.map((s) =>
          s.items.length === 0 ? null : (
            <Card key={s.key} className={s.tint}>
              <div className="flex items-center gap-2 border-b border-stone-100 px-4 py-3">
                {s.icon}
                <h2 className="text-[13.5px] font-bold text-stone-900">{s.title}</h2>
                <span className="tnum rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-bold text-stone-600">
                  {s.items.length}
                </span>
              </div>
              <ul className="divide-y divide-stone-100">
                {s.items.map(({ task, project }) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    project={project}
                    onToggleTask={onToggleTask}
                    onOpenProject={onOpenProject}
                  />
                ))}
              </ul>
            </Card>
          )
        )
      )}
    </div>
  );
}
