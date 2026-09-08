'use client';

import React from 'react';
import { X, Plus, Trash2, Tag, Calendar } from 'lucide-react';
import { Project, ProjectStatus, ProjectPriority } from '@/lib/types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Partial<Project>) => Promise<void>;
  projectToEdit?: Project | null;
}

const CATEGORY_PRESETS = [
  'Web Dev',
  'Mobile App',
  'AI & ML',
  'DevOps & Cloud',
  'Fintech',
  'Design & UX',
  'Client Work',
  'Research',
];

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  projectToEdit,
}: ProjectModalProps) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('Web Dev');
  const [status, setStatus] = React.useState<ProjectStatus>('planning');
  const [priority, setPriority] = React.useState<ProjectPriority>('medium');
  const [progressPercent, setProgressPercent] = React.useState(0);
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (projectToEdit) {
      setTitle(projectToEdit.title);
      setDescription(projectToEdit.description || '');
      setCategory(projectToEdit.category || 'Web Dev');
      setStatus(projectToEdit.status);
      setPriority(projectToEdit.priority);
      setProgressPercent(projectToEdit.progress_percent);
      setStartDate(projectToEdit.start_date || '');
      setDueDate(projectToEdit.due_date || '');
      setTags(projectToEdit.tags || []);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      setTitle('');
      setDescription('');
      setCategory('Web Dev');
      setStatus('planning');
      setPriority('medium');
      setProgressPercent(0);
      setStartDate(today);
      setDueDate(thirtyDays);
      setTags(['TypeScript', 'Fullstack']);
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        ...(projectToEdit ? { id: projectToEdit.id } : {}),
        title,
        description,
        category,
        status,
        priority,
        progress_percent: Number(progressPercent),
        start_date: startDate,
        due_date: dueDate,
        tags,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-fade-in my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {projectToEdit ? 'Edit Proyek' : 'Buat Proyek Baru'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Isi parameter proyek untuk melacak milestone dan progres secara akurat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Nama Proyek <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Platform Analitik AI Generatif"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Deskripsi Ringkas
            </label>
            <textarea
              rows={3}
              placeholder="Tujuan proyek, cakupan, dan deliverables utama..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                {CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="low">Rendah (Low)</option>
                <option value="medium">Sedang (Medium)</option>
                <option value="high">Tinggi (High)</option>
                <option value="urgent">Mendesak (Urgent)</option>
              </select>
            </div>
          </div>

          {/* Status & Progress Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="planning">Perencanaan (Planning)</option>
                <option value="in_progress">Sedang Berjalan (In Progress)</option>
                <option value="on_hold">Ditangguhkan (On Hold)</option>
                <option value="completed">Selesai (Completed)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Progres Manual
                </label>
                <span className="text-xs font-mono font-bold text-sky-400">
                  {progressPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={progressPercent}
                onChange={(e) => setProgressPercent(Number(e.target.value))}
                className="w-full accent-indigo-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-zinc-400">
                *Progres otomatis terhitung jika Anda mencentang task
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Tanggal Mulai
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Target Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Tags & Teknologi
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik tag lalu tekan Enter (mis: React, Next.js, API)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-700/80 bg-zinc-950 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition-colors"
              >
                Tambah
              </button>
            </div>

            {tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-zinc-800/80 text-zinc-200 border border-zinc-700"
                  >
                    <span>{tag}</span>
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

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-700/70 text-zinc-300 hover:bg-zinc-800 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : projectToEdit ? 'Simpan Perubahan' : 'Buat Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
