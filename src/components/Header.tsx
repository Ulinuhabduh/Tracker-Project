'use client';

import React from 'react';
import { 
  Database, 
  Plus, 
  RefreshCw, 
  Layers, 
  ShieldCheck,
  Lock,
  Trash2
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getUserEmail } from '@/lib/user-session';

interface HeaderProps {
  onNewProject: () => void;
  onOpenSupabaseConfig: () => void;
  onOpenAuthModal: () => void;
  onResetData: () => void;
  onOpenClearData: () => void;
  userEmail?: string;
}

export function Header({
  onNewProject,
  onOpenSupabaseConfig,
  onOpenAuthModal,
  onResetData,
  onOpenClearData,
  userEmail,
}: HeaderProps) {
  const [supabaseActive, setSupabaseActive] = React.useState(false);
  const [email, setEmail] = React.useState('');

  React.useEffect(() => {
    setSupabaseActive(isSupabaseConfigured());
    setEmail(userEmail || getUserEmail());
  }, [userEmail]);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/10">
            <div className="h-full w-full rounded-[11px] bg-zinc-950 flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">Project Tracker</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-wide bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO MAX
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">Realtime Progress & Live-Preview Logbook</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Secure Auth Account Button (Gmail OAuth / Email) */}
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              email
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
            }`}
            title={email ? `Terotentikasi sebagai ${email}` : 'Masuk dengan Google / Email untuk Keamanan Data'}
          >
            {email ? (
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Lock className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span className="max-w-[120px] sm:max-w-[160px] truncate">
              {email ? email : 'Koneksikan Akun (Auth)'}
            </span>
            {email && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseConfig}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              supabaseActive
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Status Database Supabase (.env.local)"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  supabaseActive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  supabaseActive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <Database className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            <span className="hidden md:inline">
              {supabaseActive ? 'Supabase Connected' : 'Supabase (Local Mode)'}
            </span>
          </button>

          {/* Reset Demo Data */}
          <button
            onClick={onResetData}
            className="p-2 rounded-lg border border-zinc-800/80 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors hidden sm:block"
            title="Muat Ulang Data Contoh Demo"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Hapus Semua Data (Danger Zone) */}
          <button
            onClick={onOpenClearData}
            className="p-2 rounded-lg border border-rose-500/20 bg-rose-950/20 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 hover:border-rose-500/40 transition-colors"
            title="Hapus Semua Data (Danger Zone)"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Create Project Button */}
          <button
            onClick={onNewProject}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden xs:inline">Proyek Baru</span>
          </button>
        </div>
      </div>
    </header>
  );
}
