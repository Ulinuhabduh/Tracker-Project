'use client';

import React from 'react';
import { ArrowRight, Check, Copy, Ellipsis, Pencil, Trash2 } from 'lucide-react';
import type { Project, ProjectStatus } from '@/lib/types';
import { getStatusBadge, getPriorityBadge } from '@/lib/utils';
import { dueLabel, isOverdue } from '@/lib/dashboard-utils';
import { ProgressBar } from './ui';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}

const STATUS_ORDER: ProjectStatus[] = ['planning', 'in_progress', 'on_hold', 'completed'];

export const ProjectCard = React.memo(function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const status = getStatusBadge(project.status);
  const priority = getPriorityBadge(project.priority);
  const overdue = isOverdue(project.due_date, project.status);

  React.useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menuOpen]);

  return (
    <article className="card card-hover flex min-h-[210px] flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.bg} ${status.text} ${status.border}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} aria-hidden="true" />
          {status.label}
        </span>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="icon-btn p-1.5"
            aria-label={`Opsi proyek ${project.title}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Ellipsis className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              aria-label={`Opsi ${project.title}`}
              className="absolute right-0 z-20 mt-1.5 w-48 animate-scale-in rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(project);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-stone-700 hover:bg-stone-100"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Ubah detail
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(project.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-stone-700 hover:bg-stone-100"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Duplikat
              </button>
              <div className="my-1 border-t border-stone-100" aria-hidden="true" />
              <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-stone-400">
                Status
              </p>
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="menuitemradio"
                  aria-checked={project.status === s}
                  onClick={() => {
                    setMenuOpen(false);
                    onStatusChange(project.id, s);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12.5px] ${
                    project.status === s
                      ? 'bg-indigo-50 font-semibold text-indigo-700'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {getStatusBadge(s).label}
                  {project.status === s ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                </button>
              ))}
              <div className="my-1 border-t border-stone-100" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(project.id);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] font-medium text-rose-700 hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Hapus
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <button type="button" onClick={() => onOpen(project)} className="mt-2.5 text-left" aria-label={`Buka proyek ${project.title}`}>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-stone-900 hover:text-indigo-700">
          {project.title}
        </h3>
      </button>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-stone-500">
        {project.description?.replace(/\s+/g, ' ').trim() || 'Belum ada deskripsi.'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="chip">{project.category}</span>
        <span className={`chip border ${priority.bg} ${priority.text} ${priority.border}`}>
          {priority.label}
        </span>
        {(project.tags ?? []).slice(0, 2).map((t) => (
          <span key={t} className="chip mono">
            #{t}
          </span>
        ))}
        {(project.tags?.length ?? 0) > 2 ? (
          <span className="mono text-[11px] text-stone-400">+{project.tags.length - 2}</span>
        ) : null}
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
          <span className={`font-semibold ${overdue ? 'text-rose-700' : 'text-stone-500'}`}>
            {dueLabel(project.due_date)}
          </span>
          <span className="tnum font-bold text-stone-800">{project.progress_percent}%</span>
        </div>
        <ProgressBar value={project.progress_percent} />
        <button
          type="button"
          onClick={() => onOpen(project)}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-indigo-700 hover:gap-2 hover:text-indigo-800"
          style={{ transition: 'gap 150ms ease, color 150ms ease' }}
          aria-label={`Buka workspace ${project.title}`}
        >
          Buka workspace
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
});
