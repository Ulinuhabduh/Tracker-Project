'use client';

import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  FileText,
  Tag,
  CheckCircle2,
  Rocket,
  Flag
} from 'lucide-react';
import { LogbookEntry, LogbookType } from '@/lib/types';
import { formatDateTime, getLogTypeMeta, renderMarkdownToHtml } from '@/lib/utils';
import { LogbookEditor } from './LogbookEditor';

interface LogbookSectionProps {
  projectId: string;
  logbooks: LogbookEntry[];
  onSaveLogbook: (data: Partial<LogbookEntry>) => Promise<void>;
  onDeleteLogbook: (id: string) => Promise<void>;
}

export function LogbookSection({
  projectId,
  logbooks,
  onSaveLogbook,
  onDeleteLogbook,
}: LogbookSectionProps) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<LogbookEntry | null>(null);
  const [filterType, setFilterType] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedIds, setExpandedIds] = React.useState<Record<string, boolean>>({});

  // By default expand the first entry
  React.useEffect(() => {
    if (logbooks.length > 0 && Object.keys(expandedIds).length === 0) {
      setExpandedIds({ [logbooks[0].id]: true });
    }
  }, [logbooks]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async (data: Partial<LogbookEntry>) => {
    await onSaveLogbook(data);
    setIsCreating(false);
    setEditingEntry(null);
  };

  const filteredLogs = logbooks.filter((log) => {
    if (filterType !== 'all' && log.log_type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(q);
      const matchContent = log.content_markdown.toLowerCase().includes(q);
      const matchBlockers = log.blockers?.toLowerCase().includes(q);
      const matchTags = log.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchBlockers || matchTags;
    }
    return true;
  });

  const getLogIcon = (type: LogbookType) => {
    switch (type) {
      case 'daily_update':
        return <Calendar className="h-4 w-4 text-sky-400" />;
      case 'milestone':
        return <Flag className="h-4 w-4 text-purple-400" />;
      case 'blocker':
        return <AlertTriangle className="h-4 w-4 text-rose-400" />;
      case 'release':
        return <Rocket className="h-4 w-4 text-emerald-400" />;
      case 'general':
      default:
        return <FileText className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Jurnal & Logbook Progres</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
              {logbooks.length} entri
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dokumentasikan setiap sprint, keputusan teknis, kendala, dan rilis harian
          </p>
        </div>

        {!isCreating && !editingEntry && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Tulis Logbook Baru</span>
          </button>
        )}
      </div>

      {/* Editor Modal/Panel when creating or editing */}
      {(isCreating || editingEntry) && (
        <LogbookEditor
          projectId={projectId}
          initialData={editingEntry}
          onSave={handleSave}
          onCancel={() => {
            setIsCreating(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari catatan logbook, tag, atau kendala..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === 'all'
                ? 'bg-zinc-700 text-white font-medium'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            Semua ({logbooks.length})
          </button>
          <button
            onClick={() => setFilterType('daily_update')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === 'daily_update'
                ? 'bg-sky-600/30 text-sky-300 font-medium border border-sky-500/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilterType('blocker')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === 'blocker'
                ? 'bg-rose-600/30 text-rose-300 font-medium border border-rose-500/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            Blockers
          </button>
          <button
            onClick={() => setFilterType('milestone')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === 'milestone'
                ? 'bg-purple-600/30 text-purple-300 font-medium border border-purple-500/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setFilterType('release')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterType === 'release'
                ? 'bg-emerald-600/30 text-emerald-300 font-medium border border-emerald-500/30'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            Releases
          </button>
        </div>
      </div>

      {/* Logbook Entries Timeline / List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center border border-zinc-800/80">
            <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-zinc-300">Belum ada catatan logbook</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Mulai catat perkembangan harian atau kendala teknis proyek Anda dengan editor live preview.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tulis Entri Pertama</span>
            </button>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = !!expandedIds[log.id];
            const meta = getLogTypeMeta(log.log_type);

            return (
              <div
                key={log.id}
                className={`glass-card rounded-2xl border transition-all duration-200 overflow-hidden ${
                  log.log_type === 'blocker'
                    ? 'border-rose-500/30 hover:border-rose-500/50'
                    : 'border-zinc-800/80 hover:border-zinc-700/80'
                }`}
              >
                {/* Entry Header */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer select-none bg-zinc-900/40 hover:bg-zinc-900/70 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                      {getLogIcon(log.log_type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${meta.bg} ${meta.text} border-current/20`}>
                          {meta.label}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-zinc-400">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateTime(log.created_at)}</span>
                        </div>
                        {log.author_name && (
                          <div className="flex items-center gap-1 text-xs text-zinc-500 font-mono">
                            <User className="h-3 w-3" />
                            <span>{log.author_name}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 hover:text-white transition-colors truncate">
                        {log.title}
                      </h3>
                    </div>
                  </div>

                  {/* Actions & Expand Chevron */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingEntry(log);
                        setIsCreating(false);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                      title="Edit dengan Live Preview"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Hapus entri logbook "${log.title}"?`)) {
                          onDeleteLogbook(log.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Hapus Log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <div className="p-1.5 text-zinc-500">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Entry Body (Collapsible) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-zinc-800/60 bg-zinc-950/40">
                    {/* Blocker banner if present */}
                    {log.blockers && (
                      <div className="mb-4 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-xs text-rose-300 flex items-start gap-2.5">
                        <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold uppercase tracking-wider text-[11px] block">
                            Kendala / Blocker Aktif:
                          </span>
                          <p className="mt-0.5 text-rose-200/90">{log.blockers}</p>
                        </div>
                      </div>
                    )}

                    {/* Rendered Markdown Body */}
                    <div
                      className="prose prose-invert max-w-none text-sm text-zinc-300 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdownToHtml(log.content_markdown),
                      }}
                    />

                    {/* Entry Tags Footer */}
                    {log.tags && log.tags.length > 0 && (
                      <div className="mt-5 pt-3 border-t border-zinc-800/60 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[11px] text-zinc-500 font-mono mr-1">Tags:</span>
                        {log.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-zinc-800/60 border border-zinc-700/50"
                          >
                            <Tag className="h-2.5 w-2.5 text-zinc-500" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
