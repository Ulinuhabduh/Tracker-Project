import type { ProjectDetailData } from './types';
import { daysUntil } from './dashboard-utils';

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function fmtDate(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

/** Laporan mingguan: 7 hari terakhir per proyek, format Markdown siap unduh/kirim. */
export function buildWeeklyReport(data: ProjectDetailData, now = new Date()): { markdown: string; filename: string } {
  const since = startOfDay(now);
  since.setDate(since.getDate() - 6);
  const inWeek = (iso?: string) => {
    if (!iso) return false;
    const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
    return !Number.isNaN(d.getTime()) && d >= since;
  };

  const done = data.tasks.filter((t) => t.status === 'done');
  const review = data.tasks.filter((t) => t.status === 'review');
  const active = data.tasks.filter((t) => t.status === 'in_progress');
  const overdue = data.tasks.filter(
    (t) => t.status !== 'done' && (daysUntil(t.due_date) ?? 0) < 0
  );
  const doneMs = data.milestones.filter((m) => m.is_completed);
  const weekLogs = data.logbooks.filter((l) => inWeek(l.created_at));
  const blockers = weekLogs.filter((l) => l.blockers?.trim() || l.log_type === 'blocker');

  // Aktivitas seminggu terakhir, dikelompokkan per penulis (akun dipakai bareng)
  const weekActs = (data.activities || []).filter((a) => inWeek(a.created_at));
  const byActor = new Map<string, number>();
  for (const a of weekActs) byActor.set(a.actor_name, (byActor.get(a.actor_name) || 0) + 1);

  const period = `${fmtDate(since.toISOString())} – ${fmtDate(now.toISOString())}`;
  const L: string[] = [];
  L.push(`# Laporan Mingguan — ${data.title}`);
  L.push(`Periode: ${period} • Progres: ${data.progress_percent}%`);
  L.push('');
  L.push('## Ringkasan');
  L.push(`- Tugas selesai: **${done.length}/${data.tasks.length}**`);
  L.push(`- Dalam review: **${review.length}** • Berjalan: **${active.length}** • Terlambat: **${overdue.length}**`);
  L.push(`- Milestone tercapai: **${doneMs.length}/${data.milestones.length}**`);
  L.push(`- Logbook minggu ini: **${weekLogs.length}** (kendala: **${blockers.length}**)`);
  if (byActor.size > 0) {
    L.push(`- Kontribusi: ${[...byActor.entries()].map(([n, c]) => `${n} (${c} aktivitas)`).join(', ')}`);
  }
  L.push('');

  if (done.length > 0) {
    L.push('## Selesai minggu ini');
    for (const t of done) L.push(`- [x] ${t.title}${t.updated_by ? ` — ${t.updated_by}` : ''}`);
    L.push('');
  }
  if (review.length > 0) {
    L.push('## Menunggu review');
    for (const t of review) L.push(`- [ ] ${t.title}`);
    L.push('');
  }
  if (overdue.length > 0) {
    L.push('## Perlu perhatian (terlambat)');
    for (const t of overdue) L.push(`- ${t.title} (deadline ${fmtDate(t.due_date)})`);
    L.push('');
  }
  if (doneMs.length > 0) {
    L.push('## Milestone tercapai');
    for (const m of doneMs) L.push(`- ${m.title}`);
    L.push('');
  }
  if (blockers.length > 0) {
    L.push('## Kendala');
    for (const l of blockers) {
      L.push(`- **${l.title}** (${fmtDateTime(l.created_at)}): ${l.blockers?.trim() || l.content_markdown.slice(0, 140)}`);
    }
    L.push('');
  }
  if (weekLogs.length > 0) {
    L.push('## Catatan minggu ini');
    for (const l of weekLogs.slice(0, 20)) {
      L.push(`- **${l.title}** — ${l.author_name || ''} (${fmtDateTime(l.created_at)})`);
    }
    L.push('');
  }
  const next = data.tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')))
    .slice(0, 5);
  if (next.length > 0) {
    L.push('## Fokus minggu depan');
    for (const t of next) L.push(`- [ ] ${t.title} (deadline ${fmtDate(t.due_date)})`);
    L.push('');
  }
  L.push(`_Dibuat otomatis oleh Tracker Nexus • ${fmtDateTime(now.toISOString())}_`);

  const markdown = L.join('\n');
  const filename = `laporan-mingguan-${slug(data.title) || 'proyek'}-${now.toISOString().slice(0, 10)}.md`;
  return { markdown, filename };
}

/** Unduh laporan mingguan sebagai file .md */
export function downloadWeeklyReport(data: ProjectDetailData): void {
  const { markdown, filename } = buildWeeklyReport(data);
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
