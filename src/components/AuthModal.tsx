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
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';
import {
  signInWithEmailPassword,
  signOutAuth,
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

export function AuthModal({ open, onClose, currentUserEmail, onAuthSuccess, onSignedOut, notify }: AuthModalProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isRateLimit = (msg: string) => /rate.?limit|too many|over.{0,10}(limit|quota)|exceeded/i.test(msg || '');

  React.useEffect(() => {
    if (open) {
      setError(null);
      if (currentUserEmail) setEmail(currentUserEmail);
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
      const res = await signInWithEmailPassword(clean, password);
      if (res.error) {
        const m = res.error.message || '';
        if (res.isNotConfirmed) {
          setError('Email ini belum dikonfirmasi. Hubungi admin untuk mengonfirmasi akun Anda.');
        } else if (isRateLimit(m)) {
          setError('Terlalu banyak percobaan masuk. Tunggu beberapa menit sebelum mencoba lagi.');
        } else {
          setError(`Gagal masuk: ${m}. Periksa kembali email & sandi.`);
        }
        return;
      }
      if (res.user) {
        onAuthSuccess(res.user.email || clean);
        onClose();
      }
    } finally {
      setBusy(false);
    }
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
              {currentUserEmail ? 'Akun Anda' : 'Masuk'}
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
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              {error ? (
                <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] leading-relaxed text-rose-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
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
                    name="current-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
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
              <p className="text-center text-[12px] leading-relaxed text-stone-500">
                Belum punya akun? Hubungi admin untuk dibuatkan.
              </p>
              <button type="submit" disabled={busy} className="btn-primary w-full py-2.5 text-[13px]">
                {busy ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" aria-hidden="true" /> Memproses…
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
