'use client';

import React from 'react';
import { CheckCheck, Plus, Settings, Cloud, HardDrive } from 'lucide-react';
import type { Project } from '@/lib/types';
import { NAV_ITEMS, type ViewKey } from './navigation';
import { Avatar } from './ui';

interface SidebarProps {
  view: ViewKey;
  onNavigate: (view: ViewKey) => void;
  projects: Project[];
  activeProjectId: string | null;
  onOpenProject: (id: string) => void;
  todayCount: number;
  deadlineCount: number;
  userEmail: string;
  cloudActive: boolean;
  onOpenAuth: () => void;
  onOpenSettings: () => void;
  onNewProject: () => void;
}

export function Sidebar({
  view,
  onNavigate,
  projects,
  activeProjectId,
  onOpenProject,
  todayCount,
  deadlineCount,
  userEmail,
  cloudActive,
  onOpenAuth,
  onOpenSettings,
  onNewProject,
}: SidebarProps) {
  const visible = projects.slice(0, 8);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-stone-200 bg-white lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pb-4 pt-5">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"
          aria-hidden="true"
        >
          <CheckCheck className="h-5 w-5" strokeWidth={2.5} />
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-none tracking-tight text-stone-900">
            Tracker Nexus
          </span>
          <span className="mt-1 block text-[11px] leading-none text-stone-500">
            Kerja fokus, rapi tercatat
          </span>
        </span>
      </div>

      {/* New project */}
      <div className="px-3">
        <button type="button" onClick={onNewProject} className="btn-primary w-full px-3 py-2.5 text-[13px]">
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          Proyek baru
        </button>
      </div>

      {/* Main nav */}
      <nav className="mt-4 space-y-0.5 px-3" aria-label="Navigasi utama">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.key && !activeProjectId;
          const badge =
            item.key === 'today' ? todayCount : item.key === 'deadlines' ? deadlineCount : 0;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              className={`nav-item${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              title={item.hint}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">{item.label}</span>
              {badge > 0 ? (
                <span
                  className={`tnum rounded-full px-1.5 py-0.5 text-[10.5px] font-bold ${
                    active ? 'bg-indigo-600 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Projects */}
      <div className="mt-5 flex min-h-0 flex-1 flex-col px-3">
        <p className="px-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-stone-400">
          Proyek
        </p>
        <div className="mt-1.5 min-h-0 flex-1 space-y-0.5 overflow-y-auto pb-2">
          {visible.length === 0 ? (
            <p className="px-2 py-2 text-[12px] text-stone-400">Belum ada proyek.</p>
          ) : (
            visible.map((p) => {
              const active = activeProjectId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenProject(p.id)}
                  className={`nav-item${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={p.title}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      p.status === 'completed'
                        ? 'bg-emerald-500'
                        : p.status === 'in_progress'
                          ? 'bg-sky-500'
                          : p.status === 'on_hold'
                            ? 'bg-amber-500'
                            : 'bg-stone-300'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{p.title}</span>
                  <span className="tnum shrink-0 text-[11px] text-stone-400">{p.progress_percent}%</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Footer: sync + user + settings */}
      <div className="border-t border-stone-200 p-3">
        <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] text-stone-500">
          {cloudActive ? (
            <>
              <Cloud className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span>Tersimpan di cloud</span>
            </>
          ) : (
            <>
              <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Tersimpan lokal</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-[10px] px-2 py-1.5 text-left transition-colors hover:bg-stone-100"
            title={userEmail ? `Masuk sebagai ${userEmail}` : 'Masuk untuk sinkron antar-device'}
          >
            <Avatar email={userEmail} size="sm" />
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-stone-700">
              {userEmail ? userEmail : 'Masuk'}
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="icon-btn shrink-0 p-2"
            aria-label="Pengaturan & backup"
            title="Pengaturan & backup"
          >
            <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}
