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
        label: 'Sedang Berjalan',
        bg: 'bg-sky-500/10 dark:bg-sky-400/10',
        text: 'text-sky-600 dark:text-sky-400',
        border: 'border-sky-500/20',
        dot: 'bg-sky-500 animate-pulse',
      };
    case 'completed':
      return {
        label: 'Selesai',
        bg: 'bg-emerald-500/10 dark:bg-emerald-400/10',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-500',
      };
    case 'on_hold':
      return {
        label: 'Tertunda',
        bg: 'bg-amber-500/10 dark:bg-amber-400/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/20',
        dot: 'bg-amber-500',
      };
    case 'planning':
    default:
      return {
        label: 'Perencanaan',
        bg: 'bg-zinc-500/10 dark:bg-zinc-400/10',
        text: 'text-zinc-600 dark:text-zinc-400',
        border: 'border-zinc-500/20',
        dot: 'bg-zinc-400',
      };
  }
}

export function getPriorityBadge(priority: ProjectPriority): { label: string; bg: string; text: string; border: string } {
  switch (priority) {
    case 'urgent':
      return {
        label: 'Urgent',
        bg: 'bg-rose-500/10',
        text: 'text-rose-500 dark:text-rose-400',
        border: 'border-rose-500/30',
      };
    case 'high':
      return {
        label: 'Tinggi',
        bg: 'bg-amber-500/10',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/20',
      };
    case 'medium':
      return {
        label: 'Sedang',
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-600 dark:text-indigo-400',
        border: 'border-indigo-500/20',
      };
    case 'low':
    default:
      return {
        label: 'Rendah',
        bg: 'bg-zinc-500/10',
        text: 'text-zinc-600 dark:text-zinc-400',
        border: 'border-zinc-500/20',
      };
  }
}

export function getLogTypeMeta(type: LogbookType): { label: string; bg: string; text: string; icon: string } {
  switch (type) {
    case 'daily_update':
      return { label: 'Daily Update', bg: 'bg-sky-500/10', text: 'text-sky-400', icon: 'Calendar' };
    case 'milestone':
      return { label: 'Milestone', bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'Flag' };
    case 'blocker':
      return { label: 'Kendala / Blocker', bg: 'bg-rose-500/10', text: 'text-rose-400', icon: 'AlertTriangle' };
    case 'release':
      return { label: 'Shipment / Release', bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'Rocket' };
    case 'general':
    default:
      return { label: 'Catatan Umum', bg: 'bg-zinc-500/10', text: 'text-zinc-400', icon: 'FileText' };
  }
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
    return `<div class="my-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-md">
      <div class="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 text-xs font-mono text-zinc-400">
        <span class="uppercase tracking-wider font-semibold">${lang || 'code'}</span>
        <span class="text-[11px] text-zinc-500">Snippet</span>
      </div>
      <pre class="p-4 overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed"><code>${code.trim()}</code></pre>
    </div>`;
  });

  // Inline Code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-800/90 text-amber-300 font-mono text-[13px] border border-zinc-700/50">$1</code>');

  // GitHub Callout Alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
  const alertRegex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\n([\s\S]*?)(?=(?:\n\s*\n|$))/gm;
  html = html.replace(alertRegex, (_match, type, content) => {
    const cleanedContent = content.replace(/^>\s*/gm, '').trim();
    let border = 'border-sky-500/40';
    let bg = 'bg-sky-950/20';
    let text = 'text-sky-300';
    let title = 'NOTE';
    let icon = 'ℹ️';

    if (type === 'TIP') {
      border = 'border-emerald-500/40';
      bg = 'bg-emerald-950/20';
      text = 'text-emerald-300';
      title = 'TIP';
      icon = '💡';
    } else if (type === 'IMPORTANT') {
      border = 'border-purple-500/40';
      bg = 'bg-purple-950/20';
      text = 'text-purple-300';
      title = 'IMPORTANT';
      icon = '📌';
    } else if (type === 'WARNING') {
      border = 'border-amber-500/40';
      bg = 'bg-amber-950/20';
      text = 'text-amber-300';
      title = 'WARNING';
      icon = '⚠️';
    } else if (type === 'CAUTION') {
      border = 'border-rose-500/40';
      bg = 'bg-rose-950/20';
      text = 'text-rose-300';
      title = 'CAUTION';
      icon = '🛑';
    }

    return `<div class="my-4 p-4 rounded-xl border-l-4 ${border} ${bg} text-zinc-200 text-sm">
      <div class="flex items-center gap-2 font-semibold ${text} mb-1.5">
        <span>${icon}</span>
        <span class="tracking-wide text-xs uppercase">${title}</span>
      </div>
      <div class="text-zinc-300 leading-relaxed pl-6">${cleanedContent.replace(/\n/g, '<br/>')}</div>
    </div>`;
  });

  // Standard Blockquotes: > quote
  html = html.replace(/^>\s*(.+)$/gm, '<blockquote class="border-l-2 border-indigo-500 pl-4 py-1.5 my-2.5 text-zinc-400 italic bg-indigo-500/5 rounded-r">$1</blockquote>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-zinc-100 mt-5 mb-2.5 tracking-tight flex items-center gap-2"><span class="w-1.5 h-4 bg-sky-500 rounded-full inline-block"></span>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-6 mb-3 tracking-tight border-b border-zinc-800 pb-1.5">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-extrabold text-white mt-7 mb-4 tracking-tight pb-2 border-b border-zinc-800">$1</h1>');
  html = html.replace(/^#### (.*$)/gim, '<h4 class="text-base font-semibold text-zinc-200 mt-4 mb-2 tracking-tight">$1</h4>');

  // Interactive Checklist: - [x] and - [ ]
  html = html.replace(/^- \[x\] (.*)$/gim, '<div class="flex items-start gap-2.5 my-1.5 text-sm text-zinc-300"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 mt-0.5 text-xs">✓</span><span class="line-through text-zinc-400">$1</span></div>');
  html = html.replace(/^- \[ \] (.*)$/gim, '<div class="flex items-start gap-2.5 my-1.5 text-sm text-zinc-300"><span class="inline-flex items-center justify-center w-4 h-4 rounded bg-zinc-800 border border-zinc-700 mt-0.5"></span><span>$1</span></div>');

  // Bullet Lists: - item or * item
  html = html.replace(/^[-*]\s+(.*)$/gim, '<li class="text-zinc-300 ml-4 list-disc my-1 text-sm leading-relaxed">$1</li>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong class="font-bold italic text-zinc-100">$1</strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-zinc-100">$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-300">$1</em>');
  html = html.replace(/~~(.*?)~~/g, '<del class="line-through text-zinc-500">$1</del>');

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
        processedLines.push('<div class="overflow-x-auto my-4 rounded-xl border border-zinc-800"><table class="w-full text-left text-sm">');
      }
      if (!tableHeaderParsed) {
        tableHeaderParsed = true;
        processedLines.push('<thead class="bg-zinc-900 text-zinc-300 text-xs font-semibold border-b border-zinc-800"><tr>');
        cells.forEach((cell) => {
          processedLines.push(`<th class="px-4 py-2.5 font-medium">${cell}</th>`);
        });
        processedLines.push('</tr></thead><tbody class="divide-y divide-zinc-800/60 bg-zinc-950/50">');
      } else {
        processedLines.push('<tr class="hover:bg-zinc-900/30 transition-colors">');
        cells.forEach((cell) => {
          processedLines.push(`<td class="px-4 py-2.5 text-zinc-300">${cell}</td>`);
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
