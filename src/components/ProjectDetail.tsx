'use client';

import React from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Tag, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  FileText, 
  CheckSquare, 
  Info,
  Layers,
  Share2,
  ExternalLink
} from 'lucide-react';
import { 
  Project, 
  ProjectDetailData, 
  Task, 
  Milestone, 
  LogbookEntry, 
  ProjectStatus 
} from '@/lib/types';
import { 
  formatDate, 
  getDaysRemaining, 
  getStatusBadge, 
  getPriorityBadge 
} from '@/lib/utils';
import { LogbookSection } from './LogbookSection';
import { TaskManager } from './TaskManager';

interface ProjectDetailProps {
  projectData: ProjectDetailData;
  onBack: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onStatusChange: (id: string, newStatus: ProjectStatus) => void;
  onSaveTask: (task: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onSaveMilestone: (ms: Partial<Milestone>) => Promise<void>;
  onDeleteMilestone: (id: string) => Promise<void>;
  onSaveLogbook: (log: Partial<LogbookEntry>) => Promise<void>;
  onDeleteLogbook: (id: string) => Promise<void>;
}

export function ProjectDetail({
  projectData,
  onBack,
  onEditProject,
  onDeleteProject,
  onStatusChange,
  onSaveTask,
  onDeleteTask,
  onSaveMilestone,
  onDeleteMilestone,
  onSaveLogbook,
  onDeleteLogbook,
}: ProjectDetailProps) {
  const [activeTab, setActiveTab] = React.useState<'logbook' | 'tasks' | 'overview'>('logbook');

  const statusMeta = getStatusBadge(projectData.status);
  const priorityMeta = getPriorityBadge(projectData.priority);
  const deadlineInfo = getDaysRemaining(projectData.due_date);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* Top Back Nav & Quick Actions */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => onEditProject(projectData)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit Proyek</span>
            <span className="sm:hidden">Edit</span>
          </button>
          <button
            onClick={() => {
              if (confirm(`Apakah Anda yakin ingin menghapus proyek "${projectData.title}"?`)) {
                onDeleteProject(projectData.id);
              }
            }}
            className="p-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Hapus Proyek"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Project Hero Banner */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-zinc-800/80 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="space-y-2.5 sm:space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] sm:text-xs font-mono font-semibold px-2 py-0.5 rounded-md sm:rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700">
                {projectData.category}
              </span>
              <span className={`text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-md sm:rounded-lg border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border}`}>
                {priorityMeta.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-medium border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                {statusMeta.label}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              {projectData.title}
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
              {projectData.description || 'Tidak ada deskripsi rinci untuk proyek ini.'}
            </p>

            {/* Dates & Timeline info */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-500" />
                <span>Mulai: <strong>{formatDate(projectData.start_date)}</strong></span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-zinc-500" />
                <span>Deadline: <strong>{formatDate(projectData.due_date)}</strong></span>
                <span className={`ml-1 font-mono font-medium ${deadlineInfo.isOverdue ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ({deadlineInfo.label})
                </span>
              </div>
            </div>
          </div>

          {/* Progress Circular / Metric Widget */}
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-5 p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-zinc-950/60 border border-zinc-800 shrink-0 w-full lg:w-auto">
            <div>
              <span className="text-[10px] sm:text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">
                Total Capaian
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                {projectData.progress_percent}%
              </span>
              <div className="w-28 sm:w-32 bg-zinc-800 rounded-full h-2 mt-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${projectData.progress_percent}%` }}
                />
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-4 sm:pl-5 flex flex-col gap-0.5 text-[11px] sm:text-xs text-zinc-400">
              <div><strong>{projectData.tasks.length}</strong> Tasks</div>
              <div><strong>{projectData.milestones.length}</strong> Milestones</div>
              <div><strong>{projectData.logbooks.length}</strong> Logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Navigation Tabs (Horizontally Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('logbook')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'logbook'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Logbook <span className="hidden sm:inline">(Live Preview)</span></span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] bg-zinc-800 font-mono text-zinc-300">
            {projectData.logbooks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'tasks'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Tugas & Milestone</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] sm:text-[11px] bg-zinc-800 font-mono text-zinc-300">
            {projectData.tasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Detail & Stack</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'logbook' && (
        <LogbookSection
          projectId={projectData.id}
          logbooks={projectData.logbooks}
          onSaveLogbook={onSaveLogbook}
          onDeleteLogbook={onDeleteLogbook}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskManager
          projectId={projectData.id}
          tasks={projectData.tasks}
          milestones={projectData.milestones}
          onSaveTask={onSaveTask}
          onDeleteTask={onDeleteTask}
          onSaveMilestone={onSaveMilestone}
          onDeleteMilestone={onDeleteMilestone}
        />
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Metadata & Tech stack */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Teknologi & Tags Proyek</h3>
            {projectData.tags && projectData.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {projectData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-mono font-medium bg-zinc-800/90 text-zinc-200 border border-zinc-700"
                  >
                    <Tag className="h-3 w-3 text-indigo-400" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Belum ada tags yang disematkan.</p>
            )}

            <div className="pt-3 sm:pt-4 border-t border-zinc-800 text-[11px] sm:text-xs space-y-2 text-zinc-400">
              <div className="flex justify-between">
                <span>Dibuat pada:</span>
                <span className="font-mono text-zinc-300">{formatDate(projectData.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Terakhir diperbarui:</span>
                <span className="font-mono text-zinc-300">{formatDate(projectData.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span>Project ID:</span>
                <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[160px]">{projectData.id}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats / Summary Card */}
          <div className="glass-card rounded-2xl p-4 sm:p-6 border border-zinc-800 space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">Status Kesehatan Proyek</h3>
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] sm:text-xs">
                <span className="text-zinc-400">Rasio Penyelesaian Task</span>
                <span className="font-mono font-bold text-white">
                  {projectData.tasks.filter((t) => t.status === 'done').length} / {projectData.tasks.length} (
                  {projectData.progress_percent}%)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] sm:text-xs">
                <span className="text-zinc-400">Milestones Terpenuhi</span>
                <span className="font-mono font-bold text-purple-400">
                  {projectData.milestones.filter((m) => m.is_completed).length} / {projectData.milestones.length}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] sm:text-xs">
                <span className="text-zinc-400">Catatan Logbook Terekam</span>
                <span className="font-mono font-bold text-sky-400">
                  {projectData.logbooks.length} entri
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
