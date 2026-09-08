'use client';

import React from 'react';
import { 
  X, 
  Mail, 
  Cloud, 
  Laptop, 
  Smartphone, 
  CheckCircle2, 
  UploadCloud, 
  LogOut,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { getUserEmail, setUserEmail, clearUserEmail } from '@/lib/user-session';
import { syncLocalDataToSupabase } from '@/lib/project-service';

interface EmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmailChanged: (newEmail: string) => void;
}

export function EmailSyncModal({
  isOpen,
  onClose,
  onEmailChanged,
}: EmailSyncModalProps) {
  const [email, setEmail] = React.useState('');
  const [currentSavedEmail, setCurrentSavedEmail] = React.useState('');
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const saved = getUserEmail();
      setEmail(saved);
      setCurrentSavedEmail(saved);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;

    setUserEmail(clean);
    setCurrentSavedEmail(clean);
    setStatusMessage(`Email ${clean} berhasil dikaitkan! Proyek akan otomatis tersinkron.`);
    onEmailChanged(clean);
  };

  const handleClearEmail = () => {
    clearUserEmail();
    setEmail('');
    setCurrentSavedEmail('');
    setStatusMessage('Email sinkronisasi telah dihapus.');
    onEmailChanged('');
  };

  const handleUploadLocal = async () => {
    if (!currentSavedEmail) return;
    setIsSyncing(true);
    setStatusMessage('Sedang menyinkronkan data lokal ke Supabase...');
    const res = await syncLocalDataToSupabase(currentSavedEmail);
    setIsSyncing(false);
    if (res.success) {
      setStatusMessage(`Berhasil menyinkronkan ${res.count} proyek ke akun ${currentSavedEmail}!`);
      onEmailChanged(currentSavedEmail);
    } else {
      setStatusMessage('Gagal menyinkronkan data. Pastikan Supabase sudah terhubung.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-fade-in my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Cloud className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Sinkronisasi Multi-Device
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Gunakan email sebagai identitas untuk auto-sync database
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

        {/* Device Sync Visualizer */}
        <div className="mt-5 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
          <div className="flex items-center justify-center gap-6 py-2 text-zinc-400">
            <div className="flex flex-col items-center gap-1.5">
              <Laptop className="h-6 w-6 text-indigo-400" />
              <span className="text-[10px] font-mono">Laptop / PC</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="h-0.5 w-12 bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500 animate-pulse" />
              <Cloud className="h-4 w-4 text-sky-400 my-0.5" />
              <span className="text-[9px] font-mono text-emerald-400">Auto Async</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Smartphone className="h-6 w-6 text-indigo-400" />
              <span className="text-[10px] font-mono">Device Lain</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400 text-center leading-relaxed">
            Cukup masukkan email yang sama di perangkat mana pun. Seluruh progres proyek, task, dan catatan logbook Anda akan otomatis terhubung ke akun Anda di Supabase.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveEmail} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Alamat Email Anda
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="email"
                required
                placeholder="nama@emailanda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300 flex items-start gap-2 animate-fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Current Saved Status */}
          {currentSavedEmail ? (
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Email Aktif Terhubung:</span>
                <span className="font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {currentSavedEmail}
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleUploadLocal}
                  disabled={isSyncing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Unggah Data Lokal ke Supabase'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearEmail}
                  className="px-3 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs transition-colors"
                  title="Hapus Kaitan Email"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-medium"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              Hubungkan & Auto-Sync
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
