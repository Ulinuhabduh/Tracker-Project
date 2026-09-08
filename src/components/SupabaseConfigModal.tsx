'use client';

import React from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink,
  Code,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  getStoredSupabaseCredentials, 
  saveStoredSupabaseCredentials, 
  testSupabaseConnection 
} from '@/lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

const SQL_SCHEMA_SNIPPET = `-- Skema Supabase PostgreSQL untuk Track Progress Project
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- RLS
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
  const [url, setUrl] = React.useState('');
  const [anonKey, setAnonKey] = React.useState('');
  const [testResult, setTestResult] = React.useState<{ success?: boolean; message?: string } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'credentials' | 'sql'>('credentials');

  React.useEffect(() => {
    if (isOpen) {
      const creds = getStoredSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Temporarily save to test
    saveStoredSupabaseCredentials(url, anonKey);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = () => {
    saveStoredSupabaseCredentials(url, anonKey);
    onConfigChanged();
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-fade-in my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Integrasi Database Supabase
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Konfigurasi koneksi PostgreSQL real-time dan skema database
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 mt-5 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'credentials'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Kredensial API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'sql'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Skrip SQL Schema</span>
          </button>
        </div>

        {activeTab === 'credentials' ? (
          <div className="mt-5 space-y-4">
            {/* Notice */}
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Mode Hybrid Persistence Aktif</span>
                <p className="mt-0.5 text-indigo-200/80 leading-relaxed">
                  Jika Supabase belum dikonfigurasi, sistem otomatis menggunakan <strong>LocalStorage</strong> dengan data mock siap pakai. Anda bisa memasukkan kredensial kapan saja tanpa kehilangan pengalaman interaktif!
                </p>
              </div>
            </div>

            {/* Supabase URL */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Supabase Anon Key */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Connection Test Result */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/20 text-rose-300'
                }`}
              >
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

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url || !anonKey}
                className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-medium transition-all disabled:opacity-50"
              >
                {isTesting ? 'Sedang Menguji...' : 'Uji Koneksi Supabase'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-medium"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all"
                >
                  Simpan Kredensial
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Salin skrip ini dan jalankan pada menu <strong>SQL Editor</strong> di dashboard Supabase Anda:
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-x-auto text-[11px] font-mono text-zinc-300 max-h-[350px] leading-relaxed">
              <code>{SQL_SCHEMA_SNIPPET}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
