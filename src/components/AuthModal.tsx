'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader,
  LogOut,
  Mail,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  resendConfirmationEmail,
  signInWithEmailPassword,
  signOutAuth,
  signUpWithEmailPassword,
  verifyEmailOtp,
} from '@/lib/supabase';
import { syncLocalDataToSupabase } from '@/lib/project-service';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  currentUserEmail: string;
  onAuthSuccess: (email: string) => void;
  onSignedOut: () => void;
  notify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

type View = 'signin' | 'signup' | 'confirm';

export function AuthModal({ open, onClose, currentUserEmail, onAuthSuccess, onSignedOut, notify }: AuthModalProps) {
  const [view, setView] = React.useState<View>('signin');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setError(null);
      setOtp('');
      if (currentUserEmail) setEmail(currentUserEmail);
      else setView('signin');
    }
  }, [open, currentUserEmail]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = email.trim().toLowerCase();
    if (!clean || !password) {
      setError('Isi email & kata sandi dulu.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    setBusy(true);
    try {
      if (view === 'signup') {
        const res = await signUpWithEmailPassword(clean, password);
        if (res.error) {
          setError(`Gagal daftar: ${res.error.message}. Coba lagi.`);
          return;
        }
        if (res.needsConfirmation) {
          setView('confirm');
          notify('info', `Tautan konfirmasi dikirim ke ${clean}.`);
        } else if (res.user) {
          onAuthSuccess(res.user.email || clean);
          onClose();
        }
      } else {
        const res = await signInWithEmailPassword(clean, password);
        if (res.error) {
          setError(
            res.isNotConfirmed
              ? 'Akun belum dikonfirmasi. Cek inbox email Anda, lalu klik tautan konfirmasi.'
              : `Gagal masuk: ${res.error.message}. Periksa kembali email & sandi.`
          );
          return;
        }
        if (res.user) {
          onAuthSuccess(res.user.email || clean);
          onClose();
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setError(null);
    setBusy(true);
    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), otp.trim());
      if (res.error) {
        setError(`Kode tidak valid: ${res.error.message}. Minta kirim ulang bila perlu.`);
        return;
      }
      if (res.user) {
        onAuthSuccess(res.user.email || email.trim().toLowerCase());
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    setResending(true);
    setError(null);
    const { error: err } = await resendConfirmationEmail(clean);
    setResending(false);
    if (err) setError(`Gagal mengirim ulang: ${err.message}.`);
    else notify('success', `Email konfirmasi baru dikirim ke ${clean}.`);
  };

  const signOut = async () => {
    setBusy(true);
    await signOutAuth();
    setBusy(false);
    onSignedOut();
    onClose();
  };

  const upload = async () => {
    if (!currentUserEmail) return;
    setSyncing(true);
    const res = await syncLocalDataToSupabase(currentUserEmail);
    setSyncing(false);
    if (res.success) notify('success', `${res.count} proyek disinkron ke ${currentUserEmail}.`);
    else notify('error', 'Gagal sinkron. Pastikan cloud tersambung di Pengaturan.');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Akun">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600" aria-hidden="true">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold tracking-tight text-stone-900">
              {currentUserEmail ? 'Akun Anda' : view === 'confirm' ? 'Konfirmasi email' : view === 'signin' ? 'Masuk' : 'Buat akun'}
            </h2>
            <p className="truncate text-[12px] text-stone-500">
              {currentUserEmail ? currentUserEmail : 'Sinkron aman antar-device via cloud'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn shrink-0 p-2" aria-label="Tutup">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {currentUserEmail ? (
            <div className="space-y-3">
              <p className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-[12.5px] leading-relaxed text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                Masuk sebagai <strong>{currentUserEmail}</strong>. Data tersinkron otomatis ke semua perangkat.
              </p>
              <button type="button" onClick={upload} disabled={syncing} className="btn-secondary w-full px-4 py-2.5 text-[12.5px]">
                {syncing ? <Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
                {syncing ? 'Menyinkron…' : 'Unggah data lokal ke cloud'}
              </button>
              <button type="button" onClick={signOut} disabled={busy} className="btn-secondary w-full px-4 py-2.5 text-[12.5px] text-rose-700 hover:border-rose-300 hover:bg-rose-50">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Keluar
              </button>
            </div>
          ) : view === 'confirm' ? (
            <div className="space-y-3">
              <div className="py-1 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600" aria-hidden="true">
                  <MailCheck className="h-6 w-6" />
                </span>
                <h3 className="mt-3 text-[14px] font-bold text-stone-900">Cek inbox Anda</h3>
                <p className="mx-auto mt-1 max-w-xs text-[12.5px] leading-relaxed text-stone-500">
                  Tautan konfirmasi dikirim ke <strong className="mono text-stone-700">{email}</strong>. Klik tautan itu, lalu masuk.
                </p>
              </div>
              <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-[11.5px] leading-relaxed text-stone-500">
                Setiap email baru membuat tautan lama hangus — selalu pakai <strong>email terbaru</strong>.
                Buka tautan saat aplikasi berjalan agar sesi langsung tersambung.
              </p>
              <form onSubmit={verify} className="space-y-2">
                <label htmlFor="otp" className="field-label">
                  Punya kode 6 digit? Masukkan di sini (opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    id="otp"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="field mono flex-1 px-3 py-2 text-center text-[13px] uppercase tracking-[0.2em]"
                  />
                  <button type="submit" disabled={busy || !otp.trim()} className="btn-primary shrink-0 px-4 py-2 text-[12.5px]">
                    Verifikasi
                  </button>
                </div>
              </form>
              {error ? (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {error}
                </p>
              ) : null}
              <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-[12.5px]">
                <button type="button" onClick={resend} disabled={resending} className="inline-flex items-center gap-1.5 font-medium text-stone-500 hover:text-stone-900">
                  <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} aria-hidden="true" />
                  {resending ? 'Mengirim…' : 'Kirim ulang'}
                </button>
                <button type="button" onClick={() => { setView('signin'); setError(null); }} className="font-semibold text-indigo-700 hover:text-indigo-800">
                  Sudah konfirmasi? Masuk
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              {error ? (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] leading-relaxed text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {error}
                    {error.includes('belum dikonfirmasi') ? (
                      <button type="button" onClick={resend} disabled={resending} className="mt-1.5 block rounded-lg bg-white px-2.5 py-1 text-[11.5px] font-semibold text-rose-700 shadow-sm">
                        {resending ? 'Mengirim…' : 'Kirim ulang email konfirmasi'}
                      </button>
                    ) : null}
                  </span>
                </p>
              ) : null}
              <div>
                <label htmlFor="auth-email" className="field-label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    id="auth-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="anda@email.com…"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field py-2.5 pl-10 pr-3.5 text-[13px]"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="auth-pass" className="field-label">
                  Kata sandi
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    id="auth-pass"
                    name={view === 'signin' ? 'current-password' : 'new-password'}
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
                    placeholder="Minimal 6 karakter…"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="field py-2.5 pl-10 pr-10 text-[13px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="icon-btn absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5"
                    aria-label={showPw ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                    aria-pressed={showPw}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-[12.5px]">
                <span className="text-stone-500">{view === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setView(view === 'signin' ? 'signup' : 'signin');
                    setError(null);
                  }}
                  className="font-semibold text-indigo-700 hover:text-indigo-800"
                >
                  {view === 'signin' ? 'Daftar' : 'Masuk'}
                </button>
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-[13px]">
                {busy ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> Memproses…
                  </>
                ) : view === 'signin' ? (
                  'Masuk'
                ) : (
                  'Daftar & kirim konfirmasi'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
