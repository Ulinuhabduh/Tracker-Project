'use client';

import React from 'react';
import { 
  Calendar, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ArrowUpRight, 
  Tag,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Project, ProjectStatus } from '@/lib/types';
import { formatDate, getDaysRemaining, getStatusBadge, getPriorityBadge } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
}

export function ProjectCard({
  project,
  onOpen,
  onEdit,
  onDelete,
  onStatusChange,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const statusMeta = getStatusBadge(project.status);
  const priorityMeta = getPriorityBadge(project.priority);
  const deadlineInfo = getDaysRemaining(project.due_date);

  const getProgressColor = (val: number) => {
    if (val >= 100) return 'from-emerald-500 to-teal-400';
    if (val >= 60) return 'from-sky-500 to-indigo-500';
    if (val >= 30) return 'from-amber-500 to-sky-500';
    return 'from-rose-500 to-amber-500';
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 relative flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-black/40 group border border-zinc-800/80 hover:border-zinc-700/80">
      {/* Top Header info */}
      <div>
        <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
              {project.category}
            </span>
            <span className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}>
              {priorityMeta.label}
            </span>
          </div>

          {/* Quick Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Menu Opsi"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-zinc-800 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-1.5 z-20 animate-fade-in text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(project);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Edit Proyek</span>
                  </button>

                  <div className="my-1 border-t border-zinc-800" />

                  <div className="px-2 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                    Ubah Status
                  </div>
                  {(['planning', 'in_progress', 'on_hold', 'completed'] as ProjectStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setMenuOpen(false);
                        onStatusChange(project.id, st);
                      }}
                      className={`w-full text-left px-2.5 py-1 rounded-md text-xs transition-colors flex items-center justify-between ${
                        project.status === st
                          ? 'text-sky-400 font-medium bg-sky-500/10'
                          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <span>{getStatusBadge(st).label}</span>
                      {project.status === st && <CheckCircle className="h-3 w-3 text-sky-400" />}
                    </button>
                  ))}

                  <div className="my-1 border-t border-zinc-800" />

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      if (confirm(`Hapus proyek "${project.title}"?`)) {
                        onDelete(project.id);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Proyek</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <h3 
          onClick={() => onOpen(project)}
          className="text-sm sm:text-base font-bold text-zinc-100 hover:text-indigo-400 cursor-pointer transition-colors leading-snug line-clamp-1"
        >
          {project.title}
        </h3>
        <p className="mt-1.5 sm:mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {project.description || 'Tidak ada deskripsi rinci untuk proyek ini.'}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400 bg-zinc-800/50 border border-zinc-800"
              >
                <Tag className="h-2.5 w-2.5 text-zinc-500" />
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="text-[10px] font-mono text-zinc-500 self-center">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section: Progress & Footer */}
      <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">Progres</span>
          <span className="font-mono font-semibold text-zinc-200 text-xs">
            {project.progress_percent}%
          </span>
        </div>
        <div className="w-full bg-zinc-800/80 rounded-full h-1.5 sm:h-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(project.progress_percent)} transition-all duration-500`}
            style={{ width: `${project.progress_percent}%` }}
          />
        </div>

        {/* Bottom meta & workspace launcher */}
        <div className="mt-3.5 sm:mt-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-medium border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
              {statusMeta.label}
            </span>

            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-400">
              <Calendar className="h-3 w-3 text-zinc-500" />
              <span className={deadlineInfo.isOverdue ? 'text-rose-400 font-medium' : ''}>
                {deadlineInfo.label}
              </span>
            </div>
          </div>

          <button
            onClick={() => onOpen(project)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 hover:text-white transition-all group-hover:bg-indigo-600/90 group-hover:text-white shrink-0 ml-auto sm:ml-0"
          >
            <span>Buka</span>
            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
