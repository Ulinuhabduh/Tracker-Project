'use client';

import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  UploadCloud,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  signInWithEmailPassword, 
  signUpWithEmailPassword, 
  signOutAuth 
} from '@/lib/supabase';
import { syncLocalDataToSupabase } from '@/lib/project-service';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserEmail?: string;
  onAuthSuccess: (email: string) => void;
  onSignedOut: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  currentUserEmail,
  onAuthSuccess,
  onSignedOut,
}: AuthModalProps) {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      if (currentUserEmail) {
        setEmail(currentUserEmail);
      }
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Harap masukkan alamat email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);

    if (mode === 'signup') {
      const { user, error } = await signUpWithEmailPassword(cleanEmail, password);
      setIsLoading(false);

      if (error) {
        setErrorMsg(`Gagal mendaftar: ${error.message}`);
      } else if (user) {
        const registeredEmail = user.email || cleanEmail;
        setSuccessMsg('Akun berhasil dibuat dan diamankan!');
        onAuthSuccess(registeredEmail);
        setTimeout(() => onClose(), 900);
      }
    } else {
      const { user, error } = await signInWithEmailPassword(cleanEmail, password);
      setIsLoading(false);

      if (error) {
        setErrorMsg(`Gagal masuk: ${error.message}`);
      } else if (user) {
        const loggedInEmail = user.email || cleanEmail;
        setSuccessMsg('Berhasil masuk ke akun terproteksi!');
        onAuthSuccess(loggedInEmail);
        setTimeout(() => onClose(), 800);
      }
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOutAuth();
    setIsLoading(false);
    onSignedOut();
    onClose();
  };

  const handleUploadLocal = async () => {
    if (!currentUserEmail) return;
    setIsSyncing(true);
    const res = await syncLocalDataToSupabase(currentUserEmail);
    setIsSyncing(false);
    if (res.success) {
      setSuccessMsg(`Berhasil menyinkronkan ${res.count} proyek ke akun ${currentUserEmail}!`);
    } else {
      setErrorMsg('Gagal menyinkronkan data lokal ke database.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentUserEmail
                  ? 'Akun Terverifikasi'
                  : mode === 'signin'
                  ? 'Masuk dengan Email & Sandi'
                  : 'Daftar Akun Baru'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Autentikasi aman terenkripsi via Supabase
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

        {/* ALREADY LOGGED IN STATE */}
        {currentUserEmail ? (
          <div className="mt-5 space-y-4">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Akun Terproteksi Kata Sandi</span>
              </div>
              <p className="text-emerald-200/80 leading-relaxed">
                Anda terhubung sebagai <strong className="font-mono text-emerald-300">{currentUserEmail}</strong>. Semua progres, task, dan logbook dienkripsi dan disinkronkan secara aman.
              </p>
            </div>

            {successMsg && (
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-2">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Status Multi-Device:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Aktif
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Metode Proteksi:</span>
                <span className="text-zinc-300 font-mono">Email & Kata Sandi</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleUploadLocal}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-300 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Unggah Data Lokal ke Akun Cloud Ini'}</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 hover:text-rose-400 text-xs font-semibold transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar dari Akun (Sign Out)</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM: EMAIL & PASSWORD ONLY */
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/25 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/25 text-xs text-emerald-300 flex items-start gap-2.5 animate-fade-in">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{successMsg}</div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="anda@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-400">
                {mode === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErrorMsg(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {mode === 'signin' ? 'Daftar Akun Baru' : 'Masuk (Sign In)'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading
                ? 'Memproses...'
                : mode === 'signin'
                ? 'Masuk ke Akun'
                : 'Buat & Amankan Akun'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
