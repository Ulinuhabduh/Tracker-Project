'use client';

import React from 'react';
import { 
  Bold, 
  Italic, 
  Heading3, 
  CheckSquare, 
  Code, 
  AlertTriangle, 
  Calendar, 
  Table as TableIcon, 
  Eye, 
  Edit, 
  Columns, 
  Save, 
  X, 
  Sparkles,
  Bookmark
} from 'lucide-react';
import { LogbookEntry, LogbookType } from '@/lib/types';
import { renderMarkdownToHtml, getLogTypeMeta } from '@/lib/utils';

interface LogbookEditorProps {
  projectId: string;
  initialData?: Partial<LogbookEntry> | null;
  onSave: (data: Partial<LogbookEntry>) => Promise<void>;
  onCancel: () => void;
}

type ViewMode = 'split' | 'editor' | 'preview';

const TEMPLATES = {
  daily: `### 🎯 Rangkuman Hari Ini
Catatan progres aktivitas pengerjaan fitur dan capaian hari ini.

#### ✅ Tugas Selesai:
- [x] Item pekerjaan 1
- [x] Item pekerjaan 2

#### ⏳ Rencana Besok:
- [ ] Item pekerjaan selanjutnya
`,
  blocker: `### 🛑 Laporan Kendala (Blocker)
Deskripsi detail masalah teknis atau eksternal yang menghambat alur kerja.

#### ⚠️ Dampak Masalah:
- Komponen yang terdampak: 
- Tingkat urgensi: Kritis / Tinggi

#### 🛠️ Langkah Mitigasi:
1. Analisis akar penyebab
2. Tindakan perbaikan sementara

> [!WARNING]
> Peringatan penting terkait risiko keterlambatan.
`,
  release: `### 🚀 Catatan Rilis / Shipment
Versi baru telah berhasil di-deploy ke staging/production.

#### 🌟 Fitur Baru:
- Peningkatan performa
- UI/UX refinements

| Komponen | Status | Hasil Uji |
| :--- | :--- | :--- |
| API Endpoints | ✅ Live | 99.9% uptime |
| Frontend UI | ✅ Live | Zero regressions |

> [!NOTE]
> Semua checklist deployment telah diverifikasi.
`
};

export function LogbookEditor({
  projectId,
  initialData,
  onSave,
  onCancel,
}: LogbookEditorProps) {
  const [title, setTitle] = React.useState(initialData?.title || '');
  const [contentMarkdown, setContentMarkdown] = React.useState(
    initialData?.content_markdown || TEMPLATES.daily
  );
  const [logType, setLogType] = React.useState<LogbookType>(
    initialData?.log_type || 'daily_update'
  );
  const [blockers, setBlockers] = React.useState(initialData?.blockers || '');
  const [authorName, setAuthorName] = React.useState(
    initialData?.author_name || 'Admin / Project Owner'
  );
  const [tagInput, setTagInput] = React.useState('');
  const [tags, setTags] = React.useState<string[]>(initialData?.tags || ['DevLog']);
  const [viewMode, setViewMode] = React.useState<ViewMode>('split');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Calculate metrics
  const wordCount = contentMarkdown.trim() ? contentMarkdown.trim().split(/\s+/).length : 0;
  const charCount = contentMarkdown.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  // Toolbar action helpers
  const insertTextAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = textarea.value;
    const selectedText = previous.substring(start, end);

    const replacement = `${before}${selectedText || 'teks'}${after}`;
    const nextVal = previous.substring(0, start) + replacement + previous.substring(end);

    setContentMarkdown(nextVal);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + (selectedText.length || 4)
      );
    }, 10);
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (t: string) => {
    setTags(tags.filter((item) => item !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentMarkdown.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...(initialData?.id ? { id: initialData.id } : {}),
        project_id: projectId,
        title: title.trim(),
        content_markdown: contentMarkdown,
        log_type: logType,
        blockers: blockers.trim(),
        author_name: authorName.trim(),
        tags,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-zinc-800 bg-zinc-950/90 shadow-2xl p-5 sm:p-7 animate-fade-in mb-8">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {initialData?.id ? 'Edit Catatan Logbook' : 'Entri Logbook Baru'}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              Live Preview Active
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Gunakan format Markdown untuk mencatat progres, kendala, atau pencapaian sprint
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'editor'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Edit className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hanya Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'split'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Split View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'preview'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Hanya Preview</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Top Metadata row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Judul Logbook <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Implementasi Edge Streaming & Penyelesaian Issue #12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-zinc-700/80 bg-zinc-900 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Log Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Tipe Log
            </label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value as LogbookType)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-zinc-900 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="daily_update">📅 Daily Update</option>
              <option value="milestone">🏁 Milestone Reached</option>
              <option value="blocker">⚠️ Kendala / Blocker</option>
              <option value="release">🚀 Release / Shipment</option>
              <option value="general">📝 Catatan Umum</option>
            </select>
          </div>
        </div>

        {/* Secondary Row: Author & Blockers summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Penulis / Author
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 text-white text-xs focus:outline-none focus:border-indigo-500"
              placeholder="Nama Anda atau role"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Ringkasan Blocker / Kendala (Opsional)
            </label>
            <input
              type="text"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 text-rose-300 placeholder-zinc-500 text-xs focus:outline-none focus:border-rose-500"
              placeholder="Kosongkan jika tidak ada kendala teknis"
            />
          </div>
        </div>

        {/* Quick Templates & Formatting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/90 border border-zinc-800">
          {/* Markdown Format Buttons */}
          <div className="flex flex-wrap items-center gap-1 text-zinc-300">
            <button
              type="button"
              onClick={() => insertTextAtCursor('**', '**')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Bold (**teks**)"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('*', '*')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Italic (*teks*)"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('### ', '\n')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('- [ ] ', '\n')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Checklist (- [ ])"
            >
              <CheckSquare className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('```typescript\n', '\n```\n')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Code Block"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('> [!NOTE]\n> Catatan penting...', '\n')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Callout Note"
            >
              <Sparkles className="h-4 w-4 text-sky-400" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('> [!WARNING]\n> Peringatan kendala...', '\n')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Callout Warning"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor('| Fitur | Status |\n| :--- | :--- |\n| UI Setup | Selesai |\n')}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Tabel Markdown"
            >
              <TableIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor(`[${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}] `)}
              className="p-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors"
              title="Sisipkan Timestamp"
            >
              <Calendar className="h-4 w-4 text-zinc-400" />
            </button>
          </div>

          {/* Quick Template Picker */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[11px] font-mono text-zinc-400 mr-1 hidden sm:inline">
              Template:
            </span>
            <button
              type="button"
              onClick={() => setContentMarkdown(TEMPLATES.daily)}
              className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setContentMarkdown(TEMPLATES.blocker)}
              className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
            >
              Blocker
            </button>
            <button
              type="button"
              onClick={() => setContentMarkdown(TEMPLATES.release)}
              className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
            >
              Release
            </button>
          </div>
        </div>

        {/* WORKSPACE: Dual-Pane Editor & Live Preview */}
        <div className={`grid gap-4 ${
          viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          {/* PANE 1: Markdown Raw Input */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
              <div className="px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
                  <Edit className="h-3 w-3 text-indigo-400" />
                  Markdown Source
                </span>
                <span className="text-[11px] text-zinc-400">
                  {charCount} karakter • {wordCount} kata
                </span>
              </div>
              <textarea
                ref={textareaRef}
                rows={16}
                value={contentMarkdown}
                onChange={(e) => setContentMarkdown(e.target.value)}
                placeholder="Tulis logbook Anda di sini menggunakan markdown..."
                className="w-full p-4 bg-transparent text-zinc-200 text-sm font-mono leading-relaxed focus:outline-none resize-y min-h-[360px]"
              />
            </div>
          )}

          {/* PANE 2: Live Rendered Preview */}
          {(viewMode === 'split' || viewMode === 'preview') && (
            <div className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
              <div className="px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                  <Eye className="h-3 w-3" />
                  Live Preview Ter-render
                </span>
                <span className="text-[11px] text-zinc-400">
                  ~{readTime} mnt baca
                </span>
              </div>
              <div className="p-4 sm:p-5 overflow-y-auto max-h-[500px] min-h-[360px] text-zinc-200">
                {contentMarkdown.trim() ? (
                  <div
                    className="prose prose-invert max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdownToHtml(contentMarkdown),
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-zinc-500 text-xs">
                    <Edit className="h-8 w-8 mb-2 stroke-[1.2]" />
                    <span>Mulai mengetik di sisi editor untuk melihat live preview...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tags management */}
        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-1">
            Tags Entri Logbook
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tambahkan tag (misal: SPRINT-1, BUGFIX, REFACTOR)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900 text-white text-xs focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
            >
              Tambah Tag
            </button>
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-zinc-400 hover:text-rose-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Save & Cancel Bar */}
        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="text-xs text-zinc-400 font-mono hidden sm:block">
            Tekan <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">Simpan Logbook</kbd> untuk merekam ke timeline proyek.
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-zinc-700/70 text-zinc-300 hover:bg-zinc-800 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Logbook'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
