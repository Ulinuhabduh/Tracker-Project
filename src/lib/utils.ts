import { ProjectStatus, ProjectPriority, LogbookType } from './types';

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function getDaysRemaining(dueDateStr?: string): { days: number; isOverdue: boolean; label: string } {
  if (!dueDateStr) return { days: 0, isOverdue: false, label: 'Tanpa deadline' };
  try {
    const due = new Date(dueDateStr);
    const now = new Date();
    // Normalize to midnight
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { days: Math.abs(diffDays), isOverdue: true, label: `Terlambat ${Math.abs(diffDays)} hari` };
    }
    if (diffDays === 0) {
      return { days: 0, isOverdue: false, label: 'Deadline hari ini' };
    }
    if (diffDays === 1) {
      return { days: 1, isOverdue: false, label: '1 hari tersisa' };
    }
    return { days: diffDays, isOverdue: false, label: `${diffDays} hari tersisa` };
  } catch {
    return { days: 0, isOverdue: false, label: dueDateStr };
  }
}

export function getStatusBadge(status: ProjectStatus): { label: string; bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'in_progress':
      return {
        label: 'Berjalan',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
      };
    case 'completed':
      return {
        label: 'Selesai',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'on_hold':
      return {
        label: 'Tertunda',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'planning':
    default:
      return {
        label: 'Perencanaan',
        bg: 'bg-stone-100',
        text: 'text-stone-600',
        border: 'border-stone-200',
        dot: 'bg-stone-400',
      };
  }
}

export function getPriorityBadge(priority: ProjectPriority): { label: string; bg: string; text: string; border: string } {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Mendesak',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    case 'high':
      return {
        label: 'Tinggi',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'medium':
      return {
        label: 'Sedang',
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
      };
    case 'low':
    default:
      return {
        label: 'Rendah',
        bg: 'bg-stone-100',
        text: 'text-stone-600',
        border: 'border-stone-200',
      };
  }
}

export function getLogTypeMeta(type: LogbookType): { label: string; bg: string; text: string; icon: string } {
  switch (type) {
    case 'daily_update':
      return { label: 'Harian', bg: 'bg-sky-50', text: 'text-sky-700', icon: 'Calendar' };
    case 'milestone':
      return { label: 'Milestone', bg: 'bg-violet-50', text: 'text-violet-700', icon: 'Flag' };
    case 'blocker':
      return { label: 'Kendala', bg: 'bg-rose-50', text: 'text-rose-700', icon: 'AlertTriangle' };
    case 'release':
      return { label: 'Rilis', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'Rocket' };
    case 'general':
    default:
      return { label: 'Catatan', bg: 'bg-stone-100', text: 'text-stone-600', icon: 'FileText' };
  }
}

/**
 * Convert markdown logbook content to plain text for PDF tables / exports.
 * Code blocks collapse to a placeholder, formatting marks are stripped.
 */
export function markdownToPlainText(md: string): string {
  if (!md) return '';
  let t = md;
  t = t.replace(/```[\s\S]*?```/g, ' [blok kode] ');
  t = t.replace(/`([^`]+)`/g, '$1');
  t = t.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/gim, '$1:');
  t = t.replace(/^>\s?/gm, '');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/^- \[x\]\s+/gim, '✓ ');
  t = t.replace(/^- \[ \]\s+/gim, '☐ ');
  t = t.replace(/^[-*]\s+/gm, '• ');
  t = t.replace(/\*\*\*(.*?)\*\*\*/g, '$1');
  t = t.replace(/\*\*(.*?)\*\*/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/\*([^*\n]+)\*/g, '$1');
  t = t.replace(/~~(.*?)~~/g, '$1');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/\|/g, ' ');
  t = t.replace(/^[ :\-]+$/gm, '');
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/**
 * Render plain-text project descriptions to HTML:
 * - blank lines start a new paragraph, single breaks are kept
 * - lines starting with "- ", "* " or "• " become bullet lists
 * - consecutive numbered lines ("1. …", "2. …") become ordered lists
 * - a lone short numbered line ("1. Tujuan Proyek") renders as a heading
 * - **tebal** renders bold
 * Input is HTML-escaped first, so this is XSS-safe.
 */
export function renderDescriptionToHtml(text: string): string {
  if (!text || !text.trim()) return '';
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inline = (s: string) =>
    esc(s).replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-semibold text-stone-900">$1</strong>'
    );
  const isBullet = (l: string) => /^[-*•]\s+\S/.test(l);
  const isOrdered = (l: string) => /^\d+[.)]\s+\S/.test(l);
  const stripBullet = (l: string) => l.replace(/^[-*•]\s+/, '');
  const stripOrdered = (l: string) => l.replace(/^\d+[.)]\s+/, '');

  const blocks: string[] = [];
  for (const para of text.split(/\n\s*\n/)) {
    const lines = para
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) continue;

    let buf: string[] = [];
    const flushBuf = () => {
      if (buf.length > 0) {
        blocks.push(`<p class="mt-2 first:mt-0">${buf.join('<br/>')}</p>`);
        buf = [];
      }
    };

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (isBullet(line)) {
        flushBuf();
        const items: string[] = [];
        while (i < lines.length && isBullet(lines[i])) {
          items.push(`<li>${inline(stripBullet(lines[i]))}</li>`);
          i++;
        }
        blocks.push(
          `<ul class="mt-2 first:mt-0 ml-5 list-disc space-y-1 marker:text-stone-400">${items.join('')}</ul>`
        );
        continue;
      }
      if (isOrdered(line)) {
        const group: string[] = [];
        let j = i;
        while (j < lines.length && isOrdered(lines[j])) {
          group.push(lines[j]);
          j++;
        }
        if (group.length >= 2) {
          flushBuf();
          blocks.push(
            `<ol class="mt-2 first:mt-0 ml-5 list-decimal space-y-1 marker:font-semibold marker:text-stone-500">${group
              .map((t) => `<li>${inline(stripOrdered(t))}</li>`)
              .join('')}</ol>`
          );
          i = j;
          continue;
        }
        flushBuf();
        if (line.length <= 80) {
          blocks.push(`<p class="mt-3 first:mt-0 font-semibold text-stone-900">${inline(line)}</p>`);
        } else {
          buf.push(inline(line));
        }
        i++;
        continue;
      }
      buf.push(inline(line));
      i++;
    }
    flushBuf();
  }
  return blocks.join('');
}

/**
 * High-fidelity Markdown to HTML renderer supporting GFM:
 * - Alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
 * - Checklists: - [ ] and - [x]
 * - Tables: | Header | Header |
 * - Code blocks with copy/styling
 * - Standard headers, bold, italics, quotes, links
 */
export function renderMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape basic HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Un-escape > for blockquotes
  html = html.replace(/^(&gt;|\&gt;)\s?/gm, '> ');

  // Fenced Code Blocks: ```lang ... ```
  html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    return `<div class="my-4 rounded-xl border border-stone-200 bg-stone-950 overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5 text-xs font-mono text-stone-300">
        <span class="uppercase tracking-wider font-semibold">${lang || 'code'}</span>
        <span class="text-[11px] text-stone-400">Snippet</span>
      </div>
      <pre class="p-4 overflow-x-auto text-xs font-mono text-stone-100 leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`;
  });

  // Inline Code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-800 font-mono text-[13px] border border-stone-200">$1</code>');

  // GitHub Callout Alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
  const alertRegex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n([\s\S]*?)(?=(?:\n\s*\n|$))/gm;
  html = html.replace(alertRegex, (_match, type, content) => {
    const cleanedContent = content.replace(/^>\s*/gm, '').trim();
    let border = 'border-sky-500';
    let bg = 'bg-sky-50';
    let text = 'text-sky-800';
    let title = 'NOTE';
    let icon = 'ℹ️';

    if (type === 'TIP') {
      border = 'border-emerald-500';
      bg = 'bg-emerald-50';
      text = 'text-emerald-800';
      title = 'TIP';
      icon = '💡';
    } else if (type === 'IMPORTANT') {
      border = 'border-violet-500';
      bg = 'bg-violet-50';
      text = 'text-violet-800';
      title = 'IMPORTANT';
      icon = '📌';
    } else if (type === 'WARNING') {
      border = 'border-amber-500';
      bg = 'bg-amber-50';
      text = 'text-amber-800';
      title = 'WARNING';
      icon = '⚠️';
    } else if (type === 'CAUTION') {
      border = 'border-rose-500';
      bg = 'bg-rose-50';
      text = 'text-rose-800';
      title = 'CAUTION';
      icon = '🛑';
    }

    return `<div class="my-4 p-4 rounded-xl border-l-4 ${border} ${bg} text-stone-700 text-sm">
      <div class="flex items-center gap-2 font-semibold ${text} mb-1.5">
        <span>${icon}</span>
        <span class="tracking-wide text-xs uppercase">${title}</span>
      </div>
      <div class="text-stone-600 leading-relaxed pl-6">${cleanedContent.replace(/\n/g, '<br/>')}</div>
    </div>`;
  });

  // Standard Blockquotes: > quote
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="border-l-2 border-indigo-400 pl-4 py-1.5 my-2.5 text-stone-500 italic bg-indigo-50/60 rounded-r">$1</blockquote>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-stone-900 mt-5 mb-2.5 tracking-tight flex items-center gap-2"><span class="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-stone-900 mt-6 mb-3 tracking-tight border-b border-stone-200 pb-1.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-stone-900 mt-7 mb-4 tracking-tight pb-2 border-b border-stone-200">$1</h1>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-stone-800 mt-4 mb-2 tracking-tight">$1</h4>');

  // Interactive Checklist: - [x] and - [ ]
  html = html.replace(/^- \[x\] (.*)$/gim, '<div class="flex items-start gap-2.5 my-1.5 text-sm text-stone-600"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-100 text-emerald-700 border border-emerald-300 mt-0.5 text-xs">✓</span><span class="line-through text-stone-400">$1</span></div>');
  html = html.replace(/^- \[ \] (.*)$/gim, '<div class="flex items-start gap-2.5 my-1.5 text-sm text-stone-600"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-white border border-stone-300 mt-0.5"></span><span>$1</span></div>');

  // Bullet Lists: - item or * item
  html = html.replace(/^[-*]\s+(.*)$/gim, '<li class="text-stone-600 ml-4 list-disc my-1 text-sm leading-relaxed">$1</li>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic text-stone-900">$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-stone-600">$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-stone-400">$1</del>');

  // Markdown Tables:
  // Detect rows like | a | b |
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableHeaderParsed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.slice(1, -1).split('|').map((c) => c.trim());
      // Check if divider line like |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaderParsed = false;
        processedLines.push('<div class="overflow-x-auto my-4 rounded-xl border border-stone-200"><table class="w-full text-left text-sm">');
      }
      if (!tableHeaderParsed) {
        tableHeaderParsed = true;
        processedLines.push('<thead class="bg-stone-100 text-stone-700 text-xs font-semibold border-b border-stone-200"><tr>');
        cells.forEach((cell) => {
          processedLines.push(`<th class="px-4 py-2.5 font-medium">${cell}</th>`);
        });
        processedLines.push('</tr></thead><tbody class="divide-y divide-stone-100 bg-white">');
      } else {
        processedLines.push('<tr class="hover:bg-stone-50 transition-colors">');
        cells.forEach((cell) => {
          processedLines.push(`<td class="px-4 py-2.5 text-stone-600">${cell}</td>`);
        });
        processedLines.push('</tr>');
      }
    } else {
      if (inTable) {
        inTable = false;
        tableHeaderParsed = false;
        processedLines.push('</tbody></table></div>');
      }
      processedLines.push(line);
    }
  }
  if (inTable) {
    processedLines.push('</tbody></table></div>');
  }

  html = processedLines.join('\n');

  // Paragraph breaks for remaining loose text lines
  html = html.replace(/\n\n+/g, '<div class="h-3"></div>');

  return html;
}
