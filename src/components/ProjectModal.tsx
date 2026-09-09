'use client';

import React from 'react';
import { Bold, Eye, List, ListOrdered, Pencil, Plus, X } from 'lucide-react';
import type { Project, ProjectPriority, ProjectStatus } from '@/lib/types';
import { renderDescriptionToHtml } from '@/lib/utils';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (d: Partial<Project>) => Promise<void>;
  projectToEdit?: Project | null;
}

const CATEGORIES = [
  'Web Dev',
  'Mobile App',
  'AI & ML',
  'DevOps & Cloud',
  'Fintech',
  'Design & UX',
  'Client Work',
  'Research',
  'Lainnya',
];

export function ProjectModal({ open, onClose, onSave, projectToEdit }: ProjectModalProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('Web Dev');
  const [status, setStatus] = React.useState<ProjectStatus>('planning');
  const [priority, setPriority] = React.useState<ProjectPriority>('medium');
  const [progress, setProgress] = React.useState(0);
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [descPreview, setDescPreview] = React.useState(false);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!open) return;
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category || 'Web Dev');
      setStatus(projectToEdit.status);
      setPriority(projectToEdit.priority);
      setProgress(projectToEdit.progress_percent || 0);
      setStartDate(projectToEdit.start_date || '');
      setDueDate(projectToEdit.due_date || '');
      setTags(projectToEdit.tags || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const in30 = new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setCategory('Web Dev');
      setStatus('planning');
      setPriority('medium');
      setProgress(0);
      setStartDate(today);
      setDueDate(in30);
      setTags([]);
    }
    setTagInput('');
  }, [projectToEdit, open]);

  if (!open) return null;

  const refocusDesc = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const el = descRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  };

  const wrapBold = () => {
    const el = descRef.current;
    if (!el) return;
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const sel = description.substring(s, e) || 'teks tebal';
    setDescription(description.substring(0, s) + `**${sel}**` + description.substring(e));
    refocusDesc(s + 2, s + 2 + sel.length);
  };

  const prefixLines = (make: (line: string, idx: number) => string) => {
    const el = descRef.current;
    if (!el) return;
    const value = description;
    let s = el.selectionStart;
    let e = el.selectionEnd;
    if (s === e) {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      const lineEnd = value.indexOf('\n', s);
      s = lineStart;
      e = lineEnd === -1 ? value.length : lineEnd;
    } else {
      s = value.lastIndexOf('\n', s - 1) + 1;
      const nl = value.indexOf('\n', e);
      e = nl === -1 ? value.length : nl;
    }
    const body = value.substring(s, e) || 'Poin pertama';
    const next = body
      .split('\n')
      .map((l, idx) => make(l, idx))
      .join('\n');
    setDescription(value.substring(0, s) + next + value.substring(e));
    refocusDesc(s, s + next.length);
  };

  const bulletList = () =>
    prefixLines((l) => (/^[-*•]\s+/.test(l.trim()) ? l : `- ${l.trim() || 'Poin baru'}`));

  const numberedList = () =>
    prefixLines((l, idx) =>
      /^\d+[.)]\s+/.test(l.trim()) ? l : `${idx + 1}. ${l.trim() || 'Poin baru'}`
    );

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...(projectToEdit ? { id: projectToEdit.id } : {}),
        title: title.trim(),
        description: description.trim(),
        category,
        status,
        priority,
        progress_percent: Number(progress),
        start_date: startDate,
        due_date: dueDate,
        tags,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={projectToEdit ? 'Ubah proyek' : 'Proyek baru'}>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel relative flex max-h-[94vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:mx-6 sm:max-w-4xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-stone-900">
              {projectToEdit ? 'Ubah proyek' : 'Proyek baru'}
            </h2>
            <p className="mt-0.5 text-[12px] text-stone-500">Detail rapi, progres mudah dilacak.</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn p-2" aria-label="Tutup">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="grid items-start gap-5 overflow-y-auto px-5 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
          <div>
            <label htmlFor="pj-nama" className="field-label">
              Nama proyek <span className="text-rose-600">*</span>
            </label>
            <input
              id="pj-nama"
              required
              autoComplete="off"
              placeholder="mis: Aplikasi kasir UMKM…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="field px-3.5 py-2.5 text-[14px]"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor="pj-deskripsi" className="text-[12px] font-semibold text-stone-700">
                Deskripsi
              </label>
              <span className="flex items-center gap-0.5" role="toolbar" aria-label="Format deskripsi">
                <button
                  type="button"
                  onClick={wrapBold}
                  className="icon-btn p-1.5"
                  title="Tebal (**teks**)"
                  aria-label="Tebalkan teks terpilih"
                >
                  <Bold className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={bulletList}
                  className="icon-btn p-1.5"
                  title="Bullet list (- poin)"
                  aria-label="Jadikan bullet list"
                >
                  <List className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={numberedList}
                  className="icon-btn p-1.5"
                  title="Numbered list (1. poin)"
                  aria-label="Jadikan numbered list"
                >
                  <ListOrdered className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <span className="mx-1 h-4 w-px bg-stone-200" aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => setDescPreview((v) => !v)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-medium transition-colors ${
                    descPreview ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'
                  }`}
                  aria-pressed={descPreview}
                >
                  {descPreview ? (
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Eye className="h-3 w-3" aria-hidden="true" />
                  )}
                  {descPreview ? 'Tulis' : 'Pratinjau'}
                </button>
              </span>
            </div>
            {descPreview ? (
              <div className="min-h-[220px] rounded-[10px] border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-stone-600 lg:min-h-[300px]">
                {description.trim() ? (
                  <div dangerouslySetInnerHTML={{ __html: renderDescriptionToHtml(description) }} />
                ) : (
                  <p className="text-stone-400">Belum ada isi — tulis dulu deskripsinya…</p>
                )}
              </div>
            ) : (
              <textarea
                id="pj-deskripsi"
                ref={descRef}
                rows={10}
                placeholder={'Tujuan, cakupan, deliverables…\n\n- Poin bullet\n1. Poin bernomor\n**teks tebal**'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="field min-h-[220px] resize-y px-3.5 py-2.5 text-[13px] lg:min-h-[300px]"
              />
            )}
            <p className="mt-1 text-[11.5px] text-stone-500">
              Baris baru, bullet, nomor & **tebal** tampil rapi di halaman proyek.
            </p>
          </div>

          <div>
            <label htmlFor="pj-tag" className="field-label">
              Tag
            </label>
            <div className="flex gap-2">
              <input
                id="pj-tag"
                autoComplete="off"
                placeholder="mis: React, API… lalu Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="field flex-1 px-3.5 py-2 text-[13px]"
              />
              <button type="button" onClick={addTag} className="btn-secondary shrink-0 px-3.5 py-2 text-[12.5px]">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Tambah
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
          </div>

          <aside className="min-w-0 rounded-2xl border border-stone-200 bg-stone-50 p-4" aria-label="Pengaturan proyek">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-stone-500">
              Pengaturan
            </p>
            <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="pj-kategori" className="field-label">
                Kategori
              </label>
              <select id="pj-kategori" value={category} onChange={(e) => setCategory(e.target.value)} className="field px-3 py-2.5 text-[13px]">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pj-status" className="field-label">
                Status
              </label>
              <select id="pj-status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)} className="field px-3 py-2.5 text-[13px]">
                <option value="planning">Perencanaan</option>
                <option value="in_progress">Berjalan</option>
                <option value="on_hold">Tertunda</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
            <div>
              <label htmlFor="pj-prioritas" className="field-label">
                Prioritas
              </label>
              <select id="pj-prioritas" value={priority} onChange={(e) => setPriority(e.target.value as ProjectPriority)} className="field px-3 py-2.5 text-[13px]">
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
            </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="pj-progres" className="text-[12px] font-semibold text-stone-700">
                Progres awal
              </label>
              <span className="tnum text-[12px] font-bold text-indigo-700">{progress}%</span>
            </div>
            <input
              id="pj-progres"
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-[11.5px] text-stone-500">
              Otomatis terhitung ulang setelah tugas ditambah & diselesaikan.
            </p>
          </div>

          <div className="grid gap-3">
            <div>
              <label htmlFor="pj-mulai" className="field-label">
                Tanggal mulai
              </label>
              <input id="pj-mulai" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="field px-3.5 py-2.5 text-[13px]" />
            </div>
            <div>
              <label htmlFor="pj-deadline" className="field-label">
                Deadline
              </label>
              <input id="pj-deadline" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field px-3.5 py-2.5 text-[13px]" />
            </div>
          </div>
            </div>
          </aside>

          <div className="flex items-center justify-end gap-2 border-t border-stone-100 pt-4 lg:col-span-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4 py-2.5 text-[12.5px]">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary px-5 py-2.5 text-[12.5px]">
              {saving ? 'Menyimpan…' : projectToEdit ? 'Simpan perubahan' : 'Buat proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
