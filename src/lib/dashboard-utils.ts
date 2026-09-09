import { Project, Task, LogbookEntry, ProjectStatus } from './types';

const DAY = 86_400_000;

export function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function parseDay(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
  return Number.isNaN(d.getTime()) ? null : startOfDay(d);
}

/** Whole days from today to the due date (negative = overdue). Null when no date. */
export function daysUntil(dateStr?: string, now = new Date()): number | null {
  const due = parseDay(dateStr);
  if (!due) return null;
  return Math.round((due.getTime() - startOfDay(now).getTime()) / DAY);
}

export function isOverdue(dateStr?: string, status?: string): boolean {
  if (!dateStr || status === 'completed' || status === 'done') return false;
  const n = daysUntil(dateStr);
  return n !== null && n < 0;
}

export interface TodayGroups {
  overdue: { task: Task; project?: Project }[];
  today: { task: Task; project?: Project }[];
  upcoming: { task: Task; project?: Project }[];
}

/** Split open tasks into overdue / due today / due in the next 7 days. */
export function groupTasksForToday(tasks: Task[], projects: Project[]): TodayGroups {
  const byId = new Map(projects.map((p) => [p.id, p]));
  const groups: TodayGroups = { overdue: [], today: [], upcoming: [] };
  for (const task of tasks) {
    if (task.status === 'done') continue;
    const project = byId.get(task.project_id);
    if (project?.status === 'completed') continue;
    const n = daysUntil(task.due_date);
    if (n === null) continue;
    const item = { task, project };
    if (n < 0) groups.overdue.push(item);
    else if (n === 0) groups.today.push(item);
    else if (n <= 7) groups.upcoming.push(item);
  }
  const byDue = (a: { task: Task }, b: { task: Task }) =>
    String(a.task.due_date).localeCompare(String(b.task.due_date));
  groups.overdue.sort(byDue);
  groups.today.sort(byDue);
  groups.upcoming.sort(byDue);
  return groups;
}

export type DeadlineBucket = 'overdue' | 'week' | 'later' | 'none';

export function bucketProject(p: Project): DeadlineBucket {
  if (p.status === 'completed') return 'later';
  const n = daysUntil(p.due_date);
  if (n === null) return 'none';
  if (n < 0) return 'overdue';
  if (n <= 7) return 'week';
  return 'later';
}

export function groupProjectsByDeadline(projects: Project[]): Record<DeadlineBucket, Project[]> {
  const out: Record<DeadlineBucket, Project[]> = { overdue: [], week: [], later: [], none: [] };
  for (const p of projects) out[bucketProject(p)].push(p);
  const byDue = (a: Project, b: Project) => String(a.due_date).localeCompare(String(b.due_date));
  out.overdue.sort(byDue);
  out.week.sort(byDue);
  out.later.sort(byDue);
  return out;
}

/** Consecutive days (ending today or yesterday) with at least one logbook entry. */
export function computeStreak(logbooks: LogbookEntry[], now = new Date()): number {
  const days = new Set(
    logbooks.map((l) => {
      const d = new Date(l.created_at);
      return Number.isNaN(d.getTime()) ? '' : startOfDay(d).toISOString().slice(0, 10);
    })
  );
  days.delete('');
  let streak = 0;
  const cursor = startOfDay(now);
  if (!days.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface DayCount {
  key: string;
  label: string;
  count: number;
}

/** Logbook volume for the last 7 days, oldest → newest. */
export function activityLast7Days(logbooks: LogbookEntry[], now = new Date()): DayCount[] {
  const counts = new Map<string, number>();
  for (const l of logbooks) {
    const d = new Date(l.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = startOfDay(d).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const fmt = new Intl.DateTimeFormat('id-ID', { weekday: 'short' });
  const out: DayCount[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = startOfDay(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ key, label: fmt.format(d).replace('.', ''), count: counts.get(key) || 0 });
  }
  return out;
}

export function statusDistribution(projects: Project[]): { status: ProjectStatus; count: number }[] {
  const order: ProjectStatus[] = ['planning', 'in_progress', 'on_hold', 'completed'];
  return order.map((status) => ({
    status,
    count: projects.filter((p) => p.status === status).length,
  }));
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 19) return 'Selamat sore';
  return 'Selamat malam';
}

export function todayLabel(now = new Date()): string {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now);
}

export function shortDate(dateStr?: string): string {
  if (!dateStr) return 'Tanpa tanggal';
  const d = new Date(dateStr.length <= 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
}

/** Human due label: "Terlambat 2 hari", "Hari ini", "Besok", "3 hari lagi", "Tanpa deadline". */
export function dueLabel(dateStr?: string): string {
  const n = daysUntil(dateStr);
  if (n === null) return 'Tanpa deadline';
  if (n < 0) return `Terlambat ${Math.abs(n)} hari`;
  if (n === 0) return 'Hari ini';
  if (n === 1) return 'Besok';
  return `${n} hari lagi`;
}
