import React from 'react';
import { getStatusBadge, getPriorityBadge } from '@/lib/utils';
import type { ProjectStatus, ProjectPriority } from '@/lib/types';

export function Card({
  children,
  className = '',
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return <section className={`card${hover ? ' card-hover' : ''} ${className}`}>{children}</section>;
}

export function SectionHead({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold tracking-tight text-stone-900 text-balance">{title}</h2>
        {desc ? <p className="mt-0.5 text-[12.5px] text-stone-500">{desc}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const m = getStatusBadge(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${m.bg} ${m.text} ${m.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} aria-hidden="true" />
      {m.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ProjectPriority }) {
  const m = getPriorityBadge(priority);
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${m.bg} ${m.text} ${m.border}`}
    >
      {m.label}
    </span>
  );
}

export function ProgressBar({ value, className = '' }: { value: number; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className={`progress-track h-2 ${className}`}
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progres ${v} persen`}
    >
      <div className={`progress-fill${v >= 100 ? ' done' : ''}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card px-6 py-12 text-center">
      <div
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-stone-50 text-stone-400"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h3 className="mt-4 text-[14px] font-bold text-stone-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-[12.5px] leading-relaxed text-stone-500">{desc}</p>
      {action ? <div className="mt-5 flex items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Avatar({ email, size = 'md' }: { email?: string; size?: 'sm' | 'md' }) {
  const initial = email ? email.charAt(0).toUpperCase() : '?';
  const cls =
    size === 'sm'
      ? 'h-7 w-7 text-[11px]'
      : 'h-8 w-8 text-[12px]';
  return (
    <span
      className={`${cls} inline-flex shrink-0 items-center justify-center rounded-full font-bold ${
        email ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-700'
      }`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5" aria-hidden="true">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton mt-3 h-4 w-3/4" />
      <div className="skeleton mt-2 h-3 w-full" />
      <div className="skeleton mt-5 h-2 w-full" />
    </div>
  );
}
