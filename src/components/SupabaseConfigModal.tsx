'use client';

import React from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Code,
  FileCode,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { testSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

const SQL_SCHEMA_SNIPPET = `-- ==============================================================================
-- 🚀 SUPABASE DATABASE SCHEMA: TRACK PROGRESS PROJECT
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/_/sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE: PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLE: MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE: TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: LOGBOOKS
CREATE TABLE IF NOT EXISTS public.logbooks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    log_type TEXT NOT NULL DEFAULT 'daily_update' CHECK (log_type IN ('daily_update', 'milestone', 'blocker', 'release', 'general')),
    blockers TEXT DEFAULT '',
    author_name TEXT DEFAULT 'Admin',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_logbooks_project_id ON public.logbooks(project_id);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public all on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on milestones" ON public.milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all on logbooks" ON public.logbooks FOR ALL USING (true) WITH CHECK (true);
`;

export function SupabaseConfigModal({
  isOpen,
  onClose,
  onConfigChanged,
}: SupabaseConfigModalProps) {
  const [testResult, setTestResult] = React.useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const isConfig = isSupabaseConfigured();

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
    if (res.success) {
      onConfigChanged();
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-4 sm:p-7 z-10 animate-fade-in my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
              isConfig 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}>
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Status Koneksi Supabase
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                Koneksi terhubung otomatis melalui file <code className="text-zinc-200 font-mono">.env.local</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 sm:mt-5 space-y-4 overflow-y-auto pr-1">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConfig
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
          }`}>
            {isConfig ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-sm block mb-0.5">
                {isConfig ? 'Kredensial .env.local Terdeteksi' : 'Menunggu Kredensial di .env.local'}
              </span>
              {isConfig ? (
                <p>
                  Aplikasi telah membaca <code className="font-mono text-emerald-200">NEXT_PUBLIC_SUPABASE_URL</code> dan <code className="font-mono text-emerald-200">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> secara langsung dari kode environment.
                </p>
              ) : (
                <p>
                  Buka file <strong className="text-amber-200">.env.local</strong> di root proyek dan gantikan nilai placeholder dengan URL & Anon Key dari proyek Supabase Anda.
                </p>
              )}
            </div>
          </div>

          {/* Code snippet display for .env.local */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px] mb-2">
              <span className="flex items-center gap-1.5">
                <FileCode className="h-3.5 w-3.5 text-indigo-400" />
                .env.local
              </span>
              <span>Root Workspace</span>
            </div>
            <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto leading-relaxed">
              <code>{`NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '••••••••••••••••••••••••••••' : 'your-anon-public-key'}`}</code>
            </pre>
          </div>

          {/* Test connection output */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">
                  {testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}
                </span>
                <p className="mt-0.5 opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* SQL Schema Copy Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Code className="h-3.5 w-3.5 text-indigo-400" />
                Skrip SQL Schema Supabase (schema.sql)
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
              </button>
            </div>
            <pre className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 overflow-x-auto text-[11px] font-mono text-zinc-400 max-h-[180px] leading-relaxed">
              <code>{SQL_SCHEMA_SNIPPET}</code>
            </pre>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Sedang Menguji...' : 'Uji Koneksi Supabase Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all text-center"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
