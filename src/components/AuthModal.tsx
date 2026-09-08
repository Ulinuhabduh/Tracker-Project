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
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmailPassword, 
  signUpWithEmailPassword, 
  signOutAuth,
  isSupabaseConfigured
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
  const [tab, setTab] = React.useState<'google' | 'email'>('google');
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
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

  // Handle Google / Gmail OAuth
  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const { error } = await signInWithGoogle();
    setIsLoading(false);

    if (error) {
      setErrorMsg(
        `Gagal login dengan Google: ${error.message}. Pastikan provider Google telah diaktifkan di Supabase Dashboard (Authentication -> Providers -> Google), atau gunakan login Email & Kata Sandi di tab sebelah.`
      );
    }
  };

  // Handle Email + Password (SignIn or SignUp)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Harap isi alamat email dan kata sandi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    if (mode === 'signup') {
      const { user, error } = await signUpWithEmailPassword(email, password);
      setIsLoading(false);

      if (error) {
        setErrorMsg(`Gagal mendaftar: ${error.message}`);
      } else if (user) {
        const userEmail = user.email || email.trim().toLowerCase();
        setSuccessMsg('Akun berhasil dibuat dan diamankan!');
        onAuthSuccess(userEmail);
      }
    } else {
      const { user, error } = await signInWithEmailPassword(email, password);
      setIsLoading(false);

      if (error) {
        setErrorMsg(`Gagal masuk: ${error.message}`);
      } else if (user) {
        const userEmail = user.email || email.trim().toLowerCase();
        setSuccessMsg('Berhasil masuk ke akun terproteksi!');
        onAuthSuccess(userEmail);
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

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 sm:p-7 z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Autentikasi Akun Aman
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Proteksi data proyek dan auto-sync multi-device
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
                <span>Akun Terverifikasi & Terproteksi</span>
              </div>
              <p className="text-emerald-200/80 leading-relaxed">
                Anda sedang terhubung sebagai <strong className="font-mono text-emerald-300">{currentUserEmail}</strong>. Semua progres, task, dan logbook dienkripsi dan disinkronkan secara aman.
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
                <span>Status Sinkronisasi:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Auto-Sync Aktif
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Database:</span>
                <span className="font-mono text-zinc-300">Supabase PostgreSQL</span>
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
          /* NOT LOGGED IN: TABS GOOGLE VS EMAIL */
          <div className="mt-5 space-y-4">
            {/* Tabs */}
            <div className="flex items-center gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setTab('google')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'google'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Google / Gmail</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('email')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  tab === 'email'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Email & Sandi</span>
              </button>
            </div>

            {/* Error / Success Notification */}
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

            {/* TAB 1: GOOGLE / GMAIL OAUTH */}
            {tab === 'google' ? (
              <div className="space-y-4 py-2">
                <div className="text-center py-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                    {/* Official Google SVG Icon */}
                    <svg className="h-6 w-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white">Masuk dengan Akun Google</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    Akses aman 1-klik menggunakan otentikasi resmi Gmail / Google OAuth via Supabase
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-semibold text-xs transition-all shadow-lg active:scale-98 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google / Gmail'}</span>
                </button>

                <p className="text-[11px] text-zinc-500 text-center">
                  *Memerlukan konfigurasi Google Provider di Supabase Dashboard.
                </p>
              </div>
            ) : (
              /* TAB 2: EMAIL & PASSWORD */
              <form onSubmit={handleEmailAuth} className="space-y-3.5 py-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Kata Sandi (Password)
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-zinc-400">
                    {mode === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    {mode === 'signin' ? 'Daftar Akun Baru' : 'Masuk (Sign In)'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {isLoading
                    ? 'Memproses...'
                    : mode === 'signin'
                    ? 'Masuk Aman ke Akun'
                    : 'Daftar Akun Baru'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
