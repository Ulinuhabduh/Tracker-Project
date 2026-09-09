'use client';

import React from 'react';
import { Printer, X } from 'lucide-react';
import type { LogbookEntry, Project } from '@/lib/types';
import { formatDate, formatDateTime, getLogTypeMeta, getStatusBadge, markdownToPlainText } from '@/lib/utils';

interface LogbookPrintPreviewProps {
  project: Project;
  entries: LogbookEntry[];
  filterLabel: string;
  onClose: () => void;
}

export function LogbookPrintPreview({ project, entries, filterLabel, onClose }: LogbookPrintPreviewProps) {
  const stamp = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
  const statusLabel = getStatusBadge(project.status).label;

  const meta: [string, string][] = [
    ['Proyek', project.title],
    ['Kategori', project.category || '—'],
    ['Status', `${statusLabel} • ${project.progress_percent}%`],
    ['Periode', `${formatDate(project.start_date)} → ${formatDate(project.due_date)}`],
    ['Filter log', filterLabel],
    ['Dicetak', stamp],
  ];

  return (
    <div
      className="fixed inset-0 z-[90] overflow-y-auto bg-stone-900/60 p-3 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau PDF logbook"
    >
      <div className="mx-auto max-w-6xl">
        <div className="print:hidden mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold">Pratinjau PDF — {entries.length} entri</p>
            <p className="text-[11.5px] text-stone-300">
              Kertas A4 landscape. Klik Cetak lalu pilih “Save as PDF”.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-white/20 px-3.5 py-2 text-[12.5px] font-medium text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" aria-hidden="true" /> Tutup
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-white px-4 py-2 text-[12.5px] font-bold text-stone-900 hover:bg-stone-100"
            >
              <Printer className="h-4 w-4" aria-hidden="true" /> Cetak / Simpan PDF
            </button>
          </div>
        </div>

        <div
          id="logbook-print-sheet"
          className="overflow-hidden rounded-xl bg-white text-stone-900 shadow-2xl print:rounded-none print:shadow-none"
        >
          {/* Header */}
          <div className="border-b-2 border-stone-900 px-6 pb-4 pt-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Laporan Logbook
            </p>
            <h1 className="mt-1 text-[22px] font-bold leading-tight">{project.title}</h1>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
              {meta.map(([k, v]) => (
                <p key={k} className="text-[11px] leading-snug">
                  <span className="block font-bold uppercase tracking-wide text-stone-500" style={{ fontSize: 9 }}>
                    {k}
                  </span>
                  <span className="font-medium text-stone-900">{v}</span>
                </p>
              ))}
            </div>
          </div>

          {/* Table */}
          <table className="w-full border-collapse text-left" style={{ fontSize: 10.5 }}>
            <thead>
              <tr className="bg-stone-100 [print-color-adjust:exact]">
                {['No', 'Tanggal', 'Tipe', 'Judul', 'Isi Catatan', 'Kendala', 'Tag'].map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="border border-stone-300 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((l, i) => {
                const meta2 = getLogTypeMeta(l.log_type);
                const body = markdownToPlainText(l.content_markdown) || '—';
                return (
                  <tr key={l.id}>
                    <td className="mono border border-stone-300 px-2 py-1.5 align-top text-stone-500">
                      {i + 1}
                    </td>
                    <td className="whitespace-nowrap border border-stone-300 px-2 py-1.5 align-top">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="whitespace-nowrap border border-stone-300 px-2 py-1.5 align-top font-semibold">
                      {meta2.label}
                    </td>
                    <td className="border border-stone-300 px-2 py-1.5 align-top font-semibold">
                      {l.title}
                      {l.author_name ? (
                        <span className="block font-normal text-stone-500">oleh {l.author_name}</span>
                      ) : null}
                    </td>
                    <td className="break-words border border-stone-300 px-2 py-1.5 align-top leading-relaxed">
                      {body}
                    </td>
                    <td className="break-words border border-stone-300 px-2 py-1.5 align-top">
                      {l.blockers?.trim() ? l.blockers : '—'}
                    </td>
                    <td className="break-words border border-stone-300 px-2 py-1.5 align-top text-stone-600">
                      {l.tags?.length ? l.tags.join(', ') : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-stone-300 px-6 py-2.5 text-[10px] text-stone-500">
            <span>
              Dicetak dari <span translate="no">Tracker Nexus</span> • {stamp}
            </span>
            <span>
              {entries.length} entri • {project.title}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
