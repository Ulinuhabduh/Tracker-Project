'use client';

import React from 'react';
import { FolderGit2, Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Project } from '@/lib/types';
import { getDaysRemaining } from '@/lib/utils';

interface StatsOverviewProps {
  projects: Project[];
}

export function StatsOverview({ projects }: StatsOverviewProps) {
  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === 'in_progress').length;
  const completed = projects.filter((p) => p.status === 'completed').length;
  const onHold = projects.filter((p) => p.status === 'on_hold').length;

  const overdue = projects.filter((p) => {
    if (p.status === 'completed') return false;
    const { isOverdue } = getDaysRemaining(p.due_date);
    return isOverdue;
  }).length;

  const avgProgress = total > 0
    ? Math.round(projects.reduce((acc, p) => acc + (p.progress_percent || 0), 0) / total)
    : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* Total Projects */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Total Proyek</span>
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <FolderGit2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{total}</span>
          <span className="text-xs text-zinc-500 font-mono">portfolio</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="text-emerald-400 font-medium">{completed} selesai</span>
          <span>•</span>
          <span className="text-sky-400 font-medium">{inProgress} aktif</span>
        </div>
      </div>

      {/* In Progress */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Sedang Berjalan</span>
          <div className="h-8 w-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-sky-400">{inProgress}</span>
          <span className="text-xs text-zinc-500 font-mono">active sprint</span>
        </div>
        <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span>
          <span>{onHold > 0 ? `${onHold} ditangguhkan` : 'Semua berjalan lancar'}</span>
        </div>
      </div>

      {/* Average Progress */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Rata-rata Progres</span>
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{avgProgress}%</span>
          <span className="text-xs text-emerald-400 font-mono">completion</span>
        </div>
        {/* Progress Bar Mini */}
        <div className="mt-3 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>

      {/* Overdue / Blockers */}
      <div className="glass-card rounded-2xl p-4 sm:p-5 relative overflow-hidden group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-400">Perlu Perhatian</span>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
            overdue > 0
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              : 'bg-zinc-800/60 border border-zinc-700/50 text-zinc-400'
          }`}>
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-bold tracking-tight ${overdue > 0 ? 'text-rose-400' : 'text-zinc-300'}`}>
            {overdue}
          </span>
          <span className="text-xs text-zinc-500 font-mono">overdue deadline</span>
        </div>
        <div className="mt-2 text-xs text-zinc-400">
          {overdue > 0 ? (
            <span className="text-rose-400 font-medium">Ada proyek melebihi tenggat</span>
          ) : (
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 inline" /> Seluruh deadline aman
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
