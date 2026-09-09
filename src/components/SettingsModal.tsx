'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  HardDrive,
  Loader,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection } from '@/lib/supabase';
import {
  deleteAllData,
  exportAllData,
  importAllData,
  resetToInitialSeed,
} from '@/lib/project-service';
import { getUserEmail } from '@/lib/user-session';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  onDataChanged: () => void;
  notify: (type: 'success' | 'error' | 'info', msg: string) => void;
}

function Row({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-stone-200 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-stone-900">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">{desc}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function SettingsModal({ open, onClose, onDataChanged, notify }: SettingsModalProps) {
  const cloud = isSupabaseConfigured();
  const [testing, setTesting] = React.useState(false);
  const [testMsg, setTestMsg] = React.useState<string | null>(null);
  const [testOk, setTestOk] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [confirm, setConfirm] = React.useState('');
  const [scope, setScope] = React.useState<'all' | 'user_only'>('all');
  const [wiping, setWiping] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const userEmail = getUserEmail();

  React.useEffect(() => {
    if (open) {
      setTestMsg(null);
      setConfirm('');
      setScope(userEmail ? 'user_only' : 'all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  if (!open) return null;

  const test = async () => {
    setTesting(true);
    setTestMsg(null);
    const res = await testSupabaseConnection();
    setTesting(false);
    setTestOk(res.success);
    setTestMsg(res.message);
    if (res.success) onDataChanged();
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker-nexus-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify('success', `Backup diunduh: ${data.projects.length} proyek.`);
    } finally {
      setExporting(false);
    }
  };

  const doImport = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const res = await importAllData(JSON.parse(text));
      if (res.success) {
        onDataChanged();
        notify('success', res.message);
        onClose();
      } else {
        notify('error', res.message);
      }
    } catch {
      notify('error', 'File tidak terbaca. Pastikan file backup JSON Tracker Nexus.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const resetDemo = () => {
    if (window.confirm('Ganti data saat ini dengan data contoh?')) {
      resetToInitialSeed();
      onDataChanged();
      notify('info', 'Data contoh dimuat ulang.');
      onClose();
    }
  };

  const wipe = async () => {
    if (confirm.trim().toUpperCase() !== 'HAPUS') return;
    setWiping(true);
    try {
      const res = await deleteAllData(scope);
      onDataChanged();
      notify('info', res.message);
      onClose();
    } finally {
      setWiping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Pengaturan">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel relative flex max-h-[92vh] w-full animate-scale-in flex-col overflow-hidden rounded-t-3xl border border-stone-200 bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-stone-900">Pengaturan</h2>
            <p className="mt-0.5 text-[12px] text-stone-500">Penyimpanan, backup & data</p>
          </div>
          <button type="button" onClick={onClose} className="icon-btn p-2" aria-label="Tutup pengaturan">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {/* Cloud */}
          <section aria-label="Penyimpanan cloud">
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-stone-400">
              <Database className="h-3.5 w-3.5" aria-hidden="true" /> Penyimpanan
            </h3>
            <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[12.5px] leading-relaxed ${cloud ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-stone-200 bg-stone-50 text-stone-600'}`}>
              {cloud ? (
                <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <HardDrive className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              )}
              <p>
                {cloud
                  ? 'Cloud tersambung — data tersimpan lokal & tersinkron otomatis.'
                  : 'Mode lokal — data hanya di perangkat ini. Isi kredensial Supabase di .env.local untuk cloud sync.'}
              </p>
            </div>
            {testMsg ? (
              <p role="status" className={`mt-2 flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-[12px] ${testOk ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                {testOk ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
                {testMsg}
              </p>
            ) : null}
            <button type="button" onClick={test} disabled={testing} className="btn-secondary mt-2 w-full px-4 py-2 text-[12.5px]">
              <RefreshCw className={`h-3.5 w-3.5 ${testing ? 'animate-spin' : ''}`} aria-hidden="true" />
              {testing ? 'Menguji…' : 'Uji koneksi cloud'}
            </button>
          </section>

          {/* Backup */}
          <section aria-label="Backup data">
            <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-stone-400">
              Backup
            </h3>
            <div className="space-y-2">
              <Row
                title="Unduh backup"
                desc="Simpan seluruh proyek, tugas & logbook sebagai file JSON."
                action={
                  <button type="button" onClick={doExport} disabled={exporting} className="btn-secondary px-3.5 py-2 text-[12.5px]">
                    {exporting ? <Loader className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
                    {exporting ? '…' : 'Unduh'}
                  </button>
                }
              />
              <Row
                title="Pulihkan backup"
                desc="Ganti data saat ini dengan isi file backup."
                action={
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/json,.json"
                      className="sr-only"
                      aria-label="Pilih file backup JSON"
                      onChange={(e) => doImport(e.target.files?.[0])}
                    />
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} className="btn-secondary px-3.5 py-2 text-[12.5px]">
                      {importing ? <Loader className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
                      {importing ? '…' : 'Pilih file'}
                    </button>
                  </>
                }
              />
              <Row
                title="Data contoh"
                desc="Kembalikan data demo bawaan untuk eksplorasi."
                action={
                  <button type="button" onClick={resetDemo} className="btn-secondary px-3.5 py-2 text-[12.5px]">
                    Muat demo
                  </button>
                }
              />
            </div>
          </section>

          {/* Danger zone */}
          <section aria-label="Zona berbahaya">
            <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-rose-600">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Zona berbahaya
            </h3>
            <div className="space-y-2.5 rounded-xl border border-rose-200 bg-rose-50/50 p-3.5">
              {userEmail ? (
                <div className="grid gap-1.5" role="radiogroup" aria-label="Cakupan hapus">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-[12.5px]">
                    <input
                      type="radio"
                      name="wipe-scope"
                      checked={scope === 'user_only'}
                      onChange={() => setScope('user_only')}
                      className="accent-rose-600"
                    />
                    <span>
                      <strong className="font-semibold">Hanya data saya</strong>
                      <span className="mono block text-[11px] text-stone-500">{userEmail}</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-[12.5px]">
                    <input
                      type="radio"
                      name="wipe-scope"
                      checked={scope === 'all'}
                      onChange={() => setScope('all')}
                      className="accent-rose-600"
                    />
                    <strong className="font-semibold">Semua data</strong>
                  </label>
                </div>
              ) : null}
              <div>
                <label htmlFor="wipe-confirm" className="field-label">
                  Ketik <strong className="mono text-rose-700">HAPUS</strong> untuk konfirmasi
                </label>
                <input
                  id="wipe-confirm"
                  autoComplete="off"
                  placeholder="HAPUS…"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="field mono px-3 py-2 text-[13px]"
                />
              </div>
              <button
                type="button"
                onClick={wipe}
                disabled={confirm.trim().toUpperCase() !== 'HAPUS' || wiping}
                className="btn-danger w-full px-4 py-2.5 text-[12.5px]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                {wiping ? 'Menghapus…' : 'Hapus permanen'}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
