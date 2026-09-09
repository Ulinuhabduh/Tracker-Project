'use client';

import React from 'react';
import {
  AlertTriangle,
  Bold,
  CalendarPlus,
  CheckSquare,
  Code,
  Columns,
  Eye,
  Heading3,
  Italic,
  Pencil,
  Save,
  Sparkles,
  Table as TableIcon,
  X,
} from 'lucide-react';
import type { LogbookEntry, LogbookType } from '@/lib/types';
import { renderMarkdownToHtml } from '@/lib/utils';
import { Card } from './ui';

interface LogbookEditorProps {
  projectId: string;
  initialData?: Partial<LogbookEntry> | null;
  onSave: (d: Partial<LogbookEntry>) => Promise<void>;
  onCancel: () => void;
}

type ViewMode = 'split' | 'editor' | 'preview';

const TEMPLATES: Record<string, string> = {  daily: `### Rangkuman hari ini\nTulis capaian dan progres pengerjaan hari ini.\n\n#### Selesai\n- [x] Contoh pekerjaan selesai\n\n#### Besok\n- [ ] Rencana pekerjaan berikutnya\n`,
  blocker: `### Laporan kendala\nJelaskan masalah yang menghambat kerja.\n\n#### Dampak\n- Bagian terdampak: \n- Urgensi: Tinggi / Kritis\n\n#### Mitigasi\n1. Analisis akar masalah\n2. Solusi sementara\n\n> [!WARNING]\n> Risiko keterlambatan jika tidak segera ditangani.\n`,
  release: `### Catatan rilis\nVersi baru berhasil di-deploy.\n\n#### Yang baru\n- Peningkatan performa\n- Perbaikan tampilan\n\n| Komponen | Status |\n| :--- | :--- |\n| API | Live |\n| Tampilan | Live |\n`,
};

interface ToolDef {
  label: string;
  icon: React.ReactNode;
  before: string;
  after: string;
  stamp?: boolean;
}

const TOOL_DEFS: ToolDef[] = [
  { label: 'Tebal', icon: <Bold className="h-4 w-4" aria-hidden="true" />, before: '**', after: '**' },
  { label: 'Miring', icon: <Italic className="h-4 w-4" aria-hidden="true" />, before: '*', after: '*' },
  { label: 'Judul', icon: <Heading3 className="h-4 w-4" aria-hidden="true" />, before: '### ', after: '\n' },
  { label: 'Checklist', icon: <CheckSquare className="h-4 w-4" aria-hidden="true" />, before: '- [ ] ', after: '\n' },
  { label: 'Blok kode', icon: <Code className="h-4 w-4" aria-hidden="true" />, before: '```\n', after: '\n```\n' },
  { label: 'Catatan info', icon: <Sparkles className="h-4 w-4" aria-hidden="true" />, before: '> [!NOTE]\n> Catatan penting…', after: '\n' },
  { label: 'Peringatan', icon: <AlertTriangle className="h-4 w-4" aria-hidden="true" />, before: '> [!WARNING]\n> Peringatan…', after: '\n' },
  { label: 'Tabel', icon: <TableIcon className="h-4 w-4" aria-hidden="true" />, before: '| Kolom | Status |\n| :--- | :--- |\n| Isi | OK |\n', after: '' },
  { label: 'Sisip tanggal', icon: <CalendarPlus className="h-4 w-4" aria-hidden="true" />, before: '', after: '', stamp: true },
];

export function LogbookEditor({ projectId, initialData, onSave, onCancel }: LogbookEditorProps) {
  const [title, setTitle] = React.useState(initialData?.title || '');
  const [content, setContent] = React.useState(initialData?.content_markdown || TEMPLATES.daily);
  const [logType, setLogType] = React.useState<LogbookType>(initialData?.log_type || 'daily_update');
  const [blockers, setBlockers] = React.useState(initialData?.blockers || '');
  const [author, setAuthor] = React.useState(initialData?.author_name || '');
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = React.useState('');
  const [mode, setMode] = React.useState<ViewMode>('split');
  const [saving, setSaving] = React.useState(false);
  const areaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024 && mode === 'split') {
      setMode('editor');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  const insert = (before: string, after = '') => {
    const el = areaRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = el.value.substring(s, e);
    const next = `${el.value.substring(0, s)}${before}${sel || 'teks'}${after}${el.value.substring(e)}`;
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + (sel.length || 4));
    });
  };

  const stamp = () => {
    const now = new Date();
    const label = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(now);
    insert(`[${label}] `);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...(initialData?.id ? { id: initialData.id } : {}),
        project_id: projectId,
        title: title.trim(),
        content_markdown: content,
        log_type: logType,
        blockers: blockers.trim(),
        author_name: author.trim(),
        tags,
      });
    } finally {
      setSaving(false);
    }
  };

  const onTool = (t: ToolDef) => {
    if (t.stamp) stamp();
    else insert(t.before, t.after);
  };

  return (
    <Card className="animate-fade-up p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <h3 className="text-[14px] font-bold text-stone-900">
          {initialData?.id ? 'Ubah catatan' : 'Catatan baru'}
        </h3>
        <div className="flex items-center gap-0.5 rounded-[10px] border border-stone-200 bg-stone-50 p-0.5" role="group" aria-label="Mode editor">
          {(
            [
              { key: 'editor', label: 'Tulis', icon: <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> },
              { key: 'split', label: 'Split', icon: <Columns className="h-3.5 w-3.5" aria-hidden="true" /> },
              { key: 'preview', label: 'Pratinjau', icon: <Eye className="h-3.5 w-3.5" aria-hidden="true" /> },
            ] as { key: ViewMode; label: string; icon: React.ReactNode }[]
          ).map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              aria-pressed={mode === m.key}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                mode === m.key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="grid gap-2.5 md:grid-cols-3">
          <div className="md:col-span-2">
            <label htmlFor="log-judul" className="field-label">
              Judul <span className="text-rose-600">*</span>
            </label>
            <input
              id="log-judul"
              required
              autoComplete="off"
              placeholder="mis: Progress integrasi API pembayaran…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field px-3 py-2 text-[13px]"
            />
          </div>
          <div>
            <label htmlFor="log-tipe" className="field-label">
              Tipe
            </label>
            <select
              id="log-tipe"
              value={logType}
              onChange={(e) => setLogType(e.target.value as LogbookType)}
              className="field px-3 py-2 text-[13px]"
            >
              <option value="daily_update">Harian</option>
              <option value="milestone">Milestone</option>
              <option value="blocker">Kendala</option>
              <option value="release">Rilis</option>
              <option value="general">Catatan</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          <div>
            <label htmlFor="log-penulis" className="field-label">
              Penulis
            </label>
            <input
              id="log-penulis"
              autoComplete="off"
              placeholder="Nama Anda…"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="field px-3 py-2 text-[12.5px]"
            />
          </div>
          <div>
            <label htmlFor="log-kendala" className="field-label">
              Ringkasan kendala (opsional)
            </label>
            <input
              id="log-kendala"
              autoComplete="off"
              placeholder="Kosongkan bila lancar…"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="field px-3 py-2 text-[12.5px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1.5">
          <div className="flex items-center gap-0.5" role="toolbar" aria-label="Format teks">
            {TOOL_DEFS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => onTool(t)}
                className="icon-btn p-1.5"
                title={t.label}
                aria-label={t.label}
              >
                {t.icon}
              </button>
            ))}
          </div>
          <span className="mx-1 hidden h-5 w-px bg-stone-200 sm:inline" aria-hidden="true" />
          <div className="flex items-center gap-1 text-[11.5px]" aria-label="Template cepat">
            <span className="mono mr-0.5 text-stone-400">Template:</span>
            {Object.keys(TEMPLATES).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setContent(TEMPLATES[k])}
                className="rounded-md bg-white px-2 py-1 font-medium capitalize text-stone-600 shadow-sm transition-colors hover:text-stone-900"
              >
                {k === 'daily' ? 'Harian' : k === 'blocker' ? 'Kendala' : 'Rilis'}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-2.5 ${mode === 'split' ? 'lg:grid-cols-2' : ''}`}>
          {mode !== 'preview' ? (
            <div className="overflow-hidden rounded-xl border border-stone-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
              <p className="border-b border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-semibold text-stone-500">
                Editor <span className="mono font-normal">• {words} kata</span>
              </p>
              <label htmlFor="log-isi" className="sr-only">
                Isi catatan (markdown)
              </label>
              <textarea
                id="log-isi"
                ref={areaRef}
                rows={11}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tulis dengan format markdown…"
                className="mono min-h-[220px] w-full resize-y bg-white p-3 text-[12.5px] leading-relaxed text-stone-800 outline-none"
              />
            </div>
          ) : null}
          {mode !== 'editor' ? (
            <div className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50/60">
              <p className="border-b border-stone-200 bg-stone-50 px-3 py-1.5 text-[11px] font-semibold text-stone-500">
                Pratinjau <span className="font-normal">• ±{minutes} mnt baca</span>
              </p>
              <div className="max-h-[420px] min-h-[220px] overflow-y-auto p-4">
                {content.trim() ? (
                  <div
                    className="prose-live max-w-none text-[13px] leading-relaxed text-stone-600"
                    dangerouslySetInnerHTML={{ __html: renderMarkdownToHtml(content) }}
                  />
                ) : (
                  <p className="py-10 text-center text-[12px] text-stone-400">
                    Mulai mengetik untuk melihat pratinjau…
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label htmlFor="log-tag" className="field-label">
            Tag
          </label>
          <div className="flex gap-2">
            <input
              id="log-tag"
              autoComplete="off"
              placeholder="Tag baru + Enter…"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="field flex-1 px-3 py-2 text-[12.5px]"
            />
            <button type="button" onClick={addTag} className="btn-secondary shrink-0 px-3.5 py-2 text-[12.5px]">
              Tambah
            </button>
          </div>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  className="chip mono transition-colors hover:border-rose-300 hover:text-rose-700"
                  aria-label={`Hapus tag ${t}`}
                >
                  #{t} <X className="h-3 w-3" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-3">
          <button type="button" onClick={onCancel} className="btn-secondary px-4 py-2 text-[12.5px]">
            Batal
          </button>
          <button type="submit" disabled={saving} className="btn-primary px-5 py-2 text-[12.5px]">
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Menyimpan…' : 'Simpan catatan'}
          </button>
        </div>
      </form>
    </Card>
  );
}
