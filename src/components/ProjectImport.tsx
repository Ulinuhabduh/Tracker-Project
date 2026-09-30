'use client';

import React from 'react';
import { FileJson, Loader, Upload } from 'lucide-react';
import { importProjectsMerge } from '@/lib/project-service';
import { getUserEmail } from '@/lib/user-session';

interface ProjectImportProps {
  onImported?: (projectIds?: string[]) => void;
  notify: (type: 'success' | 'error' | 'info', msg: string) => void;
  onOpenAuth?: () => void;
  /** URL file contoh, mis. /samples/mms-magnetic-studio.json */
  sampleUrl?: string;
  sampleLabel?: string;
  compact?: boolean;
}

export function ProjectImport({
  onImported,
  notify,
  onOpenAuth,
  sampleUrl = '/samples/mms-magnetic-studio.json',
  sampleLabel = 'Contoh MMS',
  compact = false,
}: ProjectImportProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const ensureAuth = () => {
    if (getUserEmail()) return true;
    notify('info', 'Masuk dulu sebelum mengimpor proyek.');
    onOpenAuth?.();
    return false;
  };

  const importJson = async (json: unknown, sourceName: string) => {
    if (!ensureAuth()) return;
    setBusy(true);
    try {
      const res = await importProjectsMerge(json);
      if (res.success) {
        notify('success', res.message);
        onImported?.(res.importedProjectIds);
      } else {
        notify('error', res.message);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'LOGIN_REQUIRED') {
        notify('info', 'Masuk dulu sebelum mengimpor proyek.');
        onOpenAuth?.();
      } else {
        notify('error', `Gagal mengimpor ${sourceName}. Pastikan file JSON proyek yang valid.`);
      }
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      importJson(JSON.parse(await file.text()), file.name);
    } catch {
      notify('error', 'File tidak terbaca. Pastikan file JSON proyek yang valid.');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onLoadSample = async () => {
    try {
      const res = await fetch(sampleUrl);
      if (!res.ok) throw new Error('fetch failed');
      importJson(await res.json(), sampleLabel);
    } catch {
      notify('error', `Contoh ${sampleLabel} tidak ditemukan di ${sampleUrl}.`);
    }
  };

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Pilih file JSON proyek"
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => (ensureAuth() ? fileRef.current?.click() : undefined)}
          disabled={busy}
          className="btn-secondary px-3.5 py-2 text-[12.5px]"
        >
          {busy ? <Loader className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
          {busy ? '…' : 'Impor JSON'}
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          disabled={busy}
          className="btn-secondary px-3.5 py-2 text-[12.5px]"
          title={`Muat ${sampleLabel} sekali klik`}
        >
          <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
          {sampleLabel}
        </button>
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-3.5 py-3">
      <p className="text-[13px] font-semibold text-stone-900">Impor proyek dari JSON</p>
      <p className="mt-0.5 text-[12px] leading-relaxed text-stone-500">
        Gabung (merge) — data lama tetap ada. Mendukung backup penuh atau satu proyek + milestone &amp; tugas.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Pilih file JSON proyek"
        onChange={(e) => onPickFile(e.target.files?.[0])}
      />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => (ensureAuth() ? fileRef.current?.click() : undefined)}
          disabled={busy}
          className="btn-secondary px-3.5 py-2 text-[12.5px]"
        >
          {busy ? <Loader className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
          {busy ? 'Mengimpor…' : 'Pilih file JSON'}
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          disabled={busy}
          className="btn-primary px-3.5 py-2 text-[12.5px]"
          title={`Muat ${sampleLabel} sekali klik`}
        >
          <FileJson className="h-3.5 w-3.5" aria-hidden="true" />
          {sampleLabel}
        </button>
      </div>
    </div>
  );
}
