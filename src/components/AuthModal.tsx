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
  EyeOff,
  MailCheck,
  Send,
  ArrowLeft,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  signInWithEmailPassword, 
  signUpWithEmailPassword, 
  verifyEmailOtp,
  resendConfirmationEmail,
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

type AuthView = 'signin' | 'signup' | 'confirm_pending';

export function AuthModal({
  isOpen,
  onClose,
  currentUserEmail,
  onAuthSuccess,
  onSignedOut,
}: AuthModalProps) {
  const [view, setView] = React.useState<AuthView>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [otpToken, setOtpToken] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setOtpToken('');
      if (currentUserEmail) {
        setEmail(currentUserEmail);
      } else {
        setView('signin');
      }
    }
  }, [isOpen, currentUserEmail]);

  if (!isOpen) return null;

  // Handle Form Submit: Sign In or Sign Up
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

    if (view === 'signup') {
      // 1. REGISTER NEW ACCOUNT
      const { user, session, needsConfirmation, error } = await signUpWithEmailPassword(cleanEmail, password);
      setIsLoading(false);

      if (error) {
        setErrorMsg(`Gagal mendaftar: ${error.message}`);
        return;
      }

      if (needsConfirmation) {
        // MUST CONFIRM FIRST: DO NOT LOG IN AUTOMATICALLY
        setView('confirm_pending');
        setSuccessMsg(`Tautan konfirmasi telah dikirim ke ${cleanEmail}. Buka email Anda untuk konfirmasi.`);
      } else if (session && user) {
        // Email confirmation is disabled on Supabase
        const registeredEmail = user.email || cleanEmail;
        setSuccessMsg('Akun berhasil dibuat dan terhubung!');
        onAuthSuccess(registeredEmail);
        setTimeout(() => onClose(), 800);
      }
    } else {
      // 2. SIGN IN TO EXISTING ACCOUNT
      const { user, session, isNotConfirmed, error } = await signInWithEmailPassword(cleanEmail, password);
      setIsLoading(false);

      if (error) {
        if (isNotConfirmed) {
          setErrorMsg('⚠️ Akun ini belum dikonfirmasi! Silakan periksa inbox email Anda dan klik tautan konfirmasi sebelum masuk.');
        } else {
          setErrorMsg(`Gagal masuk: ${error.message}`);
        }
        return;
      }

      if (session && user) {
        const loggedInEmail = user.email || cleanEmail;
        setSuccessMsg('Berhasil masuk ke akun terproteksi!');
        onAuthSuccess(loggedInEmail);
        setTimeout(() => onClose(), 800);
      }
    }
  };

  // Handle OTP Token verification (if email provider sent OTP code)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpToken.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const { user, error } = await verifyEmailOtp(cleanEmail, otpToken.trim());
    setIsLoading(false);

    if (error) {
      setErrorMsg(`Token tidak valid atau kedaluwarsa: ${error.message}`);
      return;
    }

    if (user) {
      const verifiedEmail = user.email || cleanEmail;
      setSuccessMsg('Email berhasil dikonfirmasi dan akun kini aktif!');
      onAuthSuccess(verifiedEmail);
      setTimeout(() => onClose(), 900);
    }
  };

  // Resend confirmation email
  const handleResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    setIsResending(true);
    setErrorMsg(null);
    const { error } = await resendConfirmationEmail(cleanEmail);
    setIsResending(false);

    if (error) {
      setErrorMsg(`Gagal mengirim ulang: ${error.message}`);
    } else {
      setSuccessMsg(`Email konfirmasi baru telah dikirimkan ke ${cleanEmail}.`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-4.5 sm:p-7 z-10 animate-fade-in my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              {view === 'confirm_pending' ? (
                <MailCheck className="h-4.5 w-4.5 text-amber-400" />
              ) : (
                <ShieldCheck className="h-4.5 w-4.5" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {currentUserEmail
                  ? 'Akun Terverifikasi'
                  : view === 'confirm_pending'
                  ? 'Konfirmasi Email Diperlukan'
                  : view === 'signin'
                  ? 'Masuk ke Akun'
                  : 'Daftar Akun Baru'}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {view === 'confirm_pending'
                  ? 'Verifikasi email sebelum akun dapat terhubung'
                  : 'Autentikasi aman terenkripsi via Supabase'}
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

        {/* 1. ALREADY LOGGED IN STATE */}
        {currentUserEmail ? (
          <div className="mt-4 sm:mt-5 space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-300">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400 mb-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>Akun Terverifikasi & Terproteksi</span>
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
                <span>Status Email:</span>
                <span className="text-emerald-400 font-medium">Terkonfirmasi & Sah</span>
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
        ) : view === 'confirm_pending' ? (
          /* 2. CONFIRMATION PENDING SCREEN (MANDATORY VERIFICATION) */
          <div className="mt-4 sm:mt-5 space-y-4 animate-fade-in overflow-y-auto pr-1">
            <div className="text-center py-2">
              <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-lg shadow-amber-500/10">
                <MailCheck className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-white">Periksa Email Anda</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Tautan verifikasi telah dikirimkan ke:
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-zinc-800 font-mono text-xs font-semibold text-amber-300 border border-zinc-700">
                {email}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <span>Buka inbox atau folder spam di email Anda.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <span>Klik tautan <strong>Confirm your email</strong> pada pesan dari Supabase.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <span>Setelah terkonfirmasi, Anda dapat langsung masuk ke web app.</span>
              </div>
            </div>

            {/* Optional OTP Code input */}
            <form onSubmit={handleVerifyOtp} className="pt-2">
              <label className="block text-[11px] text-zinc-400 mb-1">
                Atau masukkan kode token verifikasi 6-digit (jika ada):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kode 6-digit"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono text-xs text-center tracking-widest uppercase focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isLoading || !otpToken.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-40 transition-all"
                >
                  {isLoading ? '...' : 'Verifikasi'}
                </button>
              </div>
            </form>

            {/* Resend button */}
            <div className="flex items-center justify-between pt-2 text-xs border-t border-zinc-800">
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`h-3 w-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Mengirim...' : 'Kirim Ulang Email'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                Sudah Konfirmasi? Masuk →
              </button>
            </div>
          </div>
        ) : (
          /* 3. SIGN IN / SIGN UP FORM */
          <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4 overflow-y-auto pr-1">
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/25 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  {errorMsg}
                  {errorMsg.includes('belum dikonfirmasi') && (
                    <div className="mt-2 pt-2 border-t border-rose-500/20">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-white bg-rose-900/50 hover:bg-rose-900/80 px-2.5 py-1 rounded-lg text-[11px] font-medium border border-rose-500/30"
                      >
                        {isResending ? 'Mengirim...' : 'Kirim Ulang Email Konfirmasi'}
                      </button>
                    </div>
                  )}
                </div>
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
                {view === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setView(view === 'signin' ? 'signup' : 'signin');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {view === 'signin' ? 'Daftar Akun Baru' : 'Masuk ke Akun'}
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
                : view === 'signin'
                ? 'Masuk ke Akun'
                : 'Daftar Akun (Kirim Konfirmasi)'}
            </button>

            {view === 'signup' && (
              <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
                *Tautan konfirmasi akan dikirimkan ke email Anda. Akun harus dikonfirmasi terlebih dahulu sebelum dapat terhubung.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
