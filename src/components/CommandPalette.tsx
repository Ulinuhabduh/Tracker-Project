'use client';

import React from 'react';
import { Search, Plus, Settings, CornerDownLeft, FolderKanban } from 'lucide-react';
import type { Project } from '@/lib/types';
import { NAV_ITEMS, type ViewKey } from './navigation';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onOpenProject: (id: string) => void;
  onNavigate: (view: ViewKey) => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
}

interface Entry {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
  icon: React.ReactNode;
}

export function CommandPalette({
  open,
  onClose,
  projects,
  onOpenProject,
  onNavigate,
  onNewProject,
  onOpenSettings,
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState('');
  const [cursor, setCursor] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      if (window.matchMedia('(pointer: fine)').matches) {
        const t = setTimeout(() => inputRef.current?.focus(), 30);
        return () => clearTimeout(t);
      }
    }
  }, [open ]);

  const entries = React.useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const nav: Entry[] = NAV_ITEMS.filter(
      (n) => !q || n.label.toLowerCase().includes(q) || n.hint.toLowerCase().includes(q)
    ).map((n) => {
      const Icon = n.icon;
      return {
        id: `nav-${n.key}`,
        group: 'Halaman',
        label: n.label,
        hint: n.hint,
        run: () => onNavigate(n.key),
        icon: <Icon className="h-4 w-4" aria-hidden="true" />,
      };
    });
    const projs: Entry[] = projects
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 6)
      .map((p) => ({
        id: `proj-${p.id}`,
        group: 'Proyek',
        label: p.title,
        hint: `${p.category} • ${p.progress_percent}%`,
        run: () => onOpenProject(p.id),
        icon: <FolderKanban className="h-4 w-4" aria-hidden="true" />,
      }));
    const actions: Entry[] = [
      {
        id: 'act-new',
        group: 'Aksi',
        label: 'Buat proyek baru',
        run: onNewProject,
        icon: <Plus className="h-4 w-4" aria-hidden="true" />,
      },
      {
        id: 'act-settings',
        group: 'Aksi',
        label: 'Pengaturan & backup',
        run: onOpenSettings,
        icon: <Settings className="h-4 w-4" aria-hidden="true" />,
      },
    ].filter((a) => !q || a.label.toLowerCase().includes(q));
    return [...nav, ...projs, ...actions];
  }, [query, projects, onNavigate, onOpenProject, onNewProject, onOpenSettings]);

  React.useEffect(() => setCursor(0), [entries.length]);

  const sections = React.useMemo(() => {
    const out: { group: string; items: { entry: Entry; index: number }[] }[] = [];
    entries.forEach((entry, index) => {
      const last = out[out.length - 1];
      if (last && last.group === entry.group) last.items.push({ entry, index });
      else out.push({ group: entry.group, items: [{ entry, index }] });
    });
    return out;
  }, [entries]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, entries.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = entries[cursor];
      if (hit) {
        onClose();
        hit.run();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Pencarian & perintah">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel relative w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
        <div className="flex items-center gap-2 border-b border-stone-200 px-4 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-100" style={{ transitionProperty: 'border-color' }}>
          <Search className="h-4 w-4 shrink-0 text-stone-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={entries[cursor] ? entries[cursor].id : undefined}
            aria-label="Cari proyek & perintah"
            placeholder="Ketik untuk mencari…"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            className="w-full bg-transparent py-3.5 text-[14px] text-stone-900 outline-none placeholder:text-stone-400"
          />
          <span className="kbd shrink-0" aria-hidden="true">
            Esc
          </span>
        </div>
        <div id="palette-list" role="listbox" className="max-h-[320px] overflow-y-auto p-1.5">
          {entries.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-stone-500">
              Tidak ada hasil untuk “{query}”.
            </p>
          ) : (
            sections.map((sec) => (
              <div key={sec.group}>
                <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-stone-400 first:pt-1">
                  {sec.group}
                </p>
                {sec.items.map(({ entry: en, index: i }) => (
                  <button
                    type="button"
                    key={en.id}
                    id={en.id}
                    role="option"
                    aria-selected={i === cursor}
                    onMouseMove={() => setCursor(i)}
                    onClick={() => {
                      onClose();
                      en.run();
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] ${
                      i === cursor ? 'bg-indigo-50 text-indigo-950' : 'text-stone-700'
                    }`}
                  >
                    <span className={i === cursor ? 'text-indigo-600' : 'text-stone-400'}>{en.icon}</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{en.label}</span>
                    {en.hint ? (
                      <span className="shrink-0 truncate text-[11px] text-stone-400">{en.hint}</span>
                    ) : null}
                    {i === cursor ? (
                      <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-indigo-400" aria-hidden="true" />
                    ) : null}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="hidden items-center gap-3 border-t border-stone-100 px-4 py-2 text-[11px] text-stone-400 sm:flex" aria-hidden="true">
          <span className="inline-flex items-center gap-1">
            <span className="kbd">↑↓</span> pilih
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="kbd">Enter</span> buka
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="kbd">Esc</span> tutup
          </span>
        </div>
      </div>
    </div>
  );
}
