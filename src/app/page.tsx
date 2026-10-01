'use client';

import React from 'react';
import type {
  LogbookEntry,
  Milestone,
  Project,
  ProjectDetailData,
  ProjectStatus,
  Subtask,
  Task,
  TaskStatus,
} from '@/lib/types';
import {
  deleteComment,
  deleteLogbook,
  deleteMilestone,
  deleteProject,
  deleteSubtask,
  deleteTask,
  duplicateProject,
  fetchAllTasks,
  fetchProjectDetail,
  fetchProjects,
  fetchRecentLogbooks,
  logActivity,
  saveComment,
  saveLogbook,
  saveMilestone,
  saveProject,
  saveSubtask,
  saveTask,
  takeCloudWarning,
} from '@/lib/project-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearUserEmail, getUserEmail, setUserEmail } from '@/lib/user-session';
import { groupProjectsByDeadline, groupTasksForToday } from '@/lib/dashboard-utils';
import { Topbar } from '@/components/Topbar';
import { BottomNav } from '@/components/BottomNav';
import { CommandPalette } from '@/components/CommandPalette';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectModal } from '@/components/ProjectModal';
import { AuthModal } from '@/components/AuthModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import { EmptyState, SkeletonCard } from '@/components/ui';
import { DashboardView } from '@/components/views/DashboardView';
import { TodayView } from '@/components/views/TodayView';
import { DeadlinesView } from '@/components/views/DeadlinesView';
import { ActivityView } from '@/components/views/ActivityView';
import type { ViewKey } from '@/components/navigation';
import { LogIn } from 'lucide-react';

export default function Home() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [allTasks, setAllTasks] = React.useState<Task[]>([]);
  const [recentLogs, setRecentLogs] = React.useState<LogbookEntry[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<ProjectDetailData | null>(null);
  const [userEmail, setUserEmailState] = React.useState('');
  const [view, setView] = React.useState<ViewKey>('dashboard');
  const [loading, setLoading] = React.useState(true);

  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [projectModal, setProjectModal] = React.useState(false);
  const [editing, setEditing] = React.useState<Project | null>(null);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const notify = React.useCallback((type: ToastMessage['type'], message: string) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  const dismissToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Parallel first load: projects + tasks + logbooks in one round trip.
  const refreshAll = React.useCallback(async () => {
    try {
      const [p, t, l] = await Promise.all([
        fetchProjects(),
        fetchAllTasks(),
        fetchRecentLogbooks(60),
      ]);
      setProjects(p);
      setAllTasks(t);
      setRecentLogs(l);
      const w = takeCloudWarning();
      if (w) notify('error', w);
    } catch {
      notify('error', 'Gagal memuat data. Coba muat ulang halaman.');
    }
  }, [notify]);

  const refreshDetail = React.useCallback(
    async (id: string) => {
      try {
        setDetail(await fetchProjectDetail(id));
        const w = takeCloudWarning();
        if (w) notify('error', w);
      } catch {
        notify('error', 'Gagal memuat detail proyek.');
      }
    },
    [notify]
  );

  React.useEffect(() => {
    setUserEmailState(getUserEmail());
    refreshAll().finally(() => setLoading(false));

    if (!isSupabaseConfigured()) return;
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email;
      if (email) {
        const v = email.toLowerCase();
        setUserEmail(v);
        setUserEmailState(v);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const email = session?.user?.email;
      if (email) {
        const v = email.toLowerCase();
        setUserEmail(v);
        setUserEmailState(v);
        refreshAll();
        if (event === 'SIGNED_IN') notify('success', `Masuk sebagai ${v}.`);
      } else if (event === 'SIGNED_OUT') {
        clearUserEmail();
        setUserEmailState('');
        setSelectedId(null);
        setDetail(null);
        refreshAll();
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [refreshAll, notify]);

  React.useEffect(() => {
    if (selectedId) refreshDetail(selectedId);
    else setDetail(null);
  }, [selectedId, refreshDetail]);

  // Global shortcuts: Ctrl/⌘K or "/" opens the palette.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === '/' && !typing && !paletteOpen) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  // ---- derived ----
  const visibleIds = React.useMemo(() => new Set(projects.map((p) => p.id)), [projects]);
  const visibleTasks = React.useMemo(
    () => allTasks.filter((t) => visibleIds.has(t.project_id)),
    [allTasks, visibleIds]
  );
  // Lapisan akhir: logbook hanya dari proyek milik akun ini
  const visibleLogs = React.useMemo(
    () => recentLogs.filter((l) => visibleIds.has(l.project_id)),
    [recentLogs, visibleIds]
  );
  const todayGroups = React.useMemo(
    () => groupTasksForToday(visibleTasks, projects),
    [visibleTasks, projects]
  );
  const deadlineGroups = React.useMemo(() => groupProjectsByDeadline(projects), [projects]);
  const todayCount = todayGroups.overdue.length + todayGroups.today.length;
  const deadlineCount = deadlineGroups.overdue.length + deadlineGroups.week.length;
  const projectName = React.useCallback(
    (id: string) => projects.find((p) => p.id === id)?.title || 'Proyek',
    [projects]
  );

  // ---- auth gate: semua tambah/ubah/hapus data wajib masuk dulu ----
  const requireAuth = React.useCallback(() => {
    if (userEmail) return true;
    notify('info', 'Masuk dulu sebelum menambah atau mengubah data.');
    setAuthOpen(true);
    return false;
  }, [userEmail, notify]);

  const handleWriteError = React.useCallback(
    (err: unknown, fallbackMsg: string) => {
      if (err instanceof Error && err.message === 'LOGIN_REQUIRED') {
        requireAuth();
      } else {
        notify('error', fallbackMsg);
      }
    },
    [requireAuth, notify]
  );

  // ---- navigation ----
  const openProject = React.useCallback((id: string) => {
    setSelectedId(id);
    setPaletteOpen(false);
  }, []);
  const goView = React.useCallback((v: ViewKey) => {
    setView(v);
    setSelectedId(null);
    setPaletteOpen(false);
  }, []);
  const newProject = React.useCallback(() => {
    if (!requireAuth()) return;
    setEditing(null);
    setProjectModal(true);
    setPaletteOpen(false);
  }, [requireAuth]);

  // ---- mutations ----
  const handleSaveProject = async (data: Partial<Project>) => {
    if (!requireAuth()) return;
    try {
      const saved = await saveProject({ ...data, user_email: userEmail || data.user_email || '' });
      notify('success', `Proyek “${saved.title}” tersimpan.`);
      await refreshAll();
      if (selectedId === saved.id) await refreshDetail(saved.id);
    } catch (err) {
      handleWriteError(err, 'Gagal menyimpan proyek. Coba lagi.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!requireAuth()) return;
    const target = projects.find((p) => p.id === id);
    if (!window.confirm(`Hapus proyek “${target?.title || ''}” beserta tugas & logbook-nya?`)) return;
    try {
      await deleteProject(id);
      notify('info', 'Proyek dihapus.');
      if (selectedId === id) setSelectedId(null);
      await refreshAll();
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus proyek.');
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!requireAuth()) return;
    try {
      const copy = await duplicateProject(id);
      if (copy) {
        notify('success', `Duplikat dibuat: “${copy.title}”.`);
        await refreshAll();
      }
    } catch (err) {
      handleWriteError(err, 'Gagal menduplikat proyek.');
    }
  };

  const handleStatus = async (id: string, status: ProjectStatus) => {
    if (!requireAuth()) return;
    try {
      await saveProject({ id, status });
      notify('success', 'Status proyek diperbarui.');
      await refreshAll();
      if (selectedId === id) await refreshDetail(id);
    } catch (err) {
      handleWriteError(err, 'Gagal memperbarui status.');
    }
  };

  const afterTaskChange = async () => {
    await Promise.all([refreshAll(), selectedId ? refreshDetail(selectedId) : Promise.resolve()]);
  };

  const handleSaveTask = async (t: Partial<Task>) => {
    if (!requireAuth()) return;
    try {
      await saveTask(t);
      await afterTaskChange();
    } catch (err) {
      handleWriteError(err, 'Gagal menyimpan tugas.');
    }
  };

  const handleToggleTask = async (task: Task) => {
    if (!requireAuth()) return;
    try {
      await saveTask({
        id: task.id,
        project_id: task.project_id,
        status: task.status === 'done' ? 'todo' : 'done',
      });
      await refreshAll();
      if (selectedId) await refreshDetail(selectedId);
    } catch (err) {
      handleWriteError(err, 'Gagal mengubah status tugas.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!selectedId || !requireAuth()) return;
    try {
      await deleteTask(id, selectedId);
      await afterTaskChange();
      notify('info', 'Tugas dihapus.');
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus tugas.');
    }
  };

  const handleSaveSubtask = async (s: Partial<Subtask> & { task_id: string; project_id: string }) => {
    if (!requireAuth()) return;
    try {
      await saveSubtask(s);
      if (selectedId) await refreshDetail(selectedId);
    } catch (err) {
      handleWriteError(err, 'Gagal menyimpan subtask.');
    }
  };

  const handleDeleteSubtask = async (id: string) => {
    if (!requireAuth()) return;
    try {
      await deleteSubtask(id);
      if (selectedId) await refreshDetail(selectedId);
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus subtask.');
    }
  };

  const handleSaveComment = async (taskId: string, content: string) => {
    if (!selectedId || !requireAuth()) return;
    try {
      await saveComment({ task_id: taskId, project_id: selectedId, content });
      await refreshDetail(selectedId);
    } catch (err) {
      if (err instanceof Error && err.message === 'EMPTY_COMMENT') return;
      handleWriteError(err, 'Gagal menyimpan komentar.');
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!requireAuth()) return;
    try {
      await deleteComment(id);
      if (selectedId) await refreshDetail(selectedId);
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus komentar.');
    }
  };

  const handleBulkStatus = async (ids: string[], status: TaskStatus) => {
    if (!selectedId || !requireAuth() || ids.length === 0) return;
    try {
      for (const id of ids) {
        await saveTask({ id, project_id: selectedId, status }, { silent: true });
      }
      await logActivity(selectedId, 'bulk_update', 'task', `${ids.length} tugas`, {
        detail: `→ ${status}`,
      });
      await afterTaskChange();
      notify('success', `${ids.length} tugas dipindah ke ${status}.`);
    } catch (err) {
      handleWriteError(err, 'Gagal memproses tugas terpilih.');
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!selectedId || !requireAuth() || ids.length === 0) return;
    try {
      for (const id of ids) {
        await deleteTask(id, selectedId);
      }
      await afterTaskChange();
      notify('info', `${ids.length} tugas dihapus.`);
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus tugas terpilih.');
    }
  };

  const handleSaveMilestone = async (m: Partial<Milestone>) => {
    if (!requireAuth()) return;
    try {
      await saveMilestone(m);
      if (selectedId) await refreshDetail(selectedId);
    } catch (err) {
      handleWriteError(err, 'Gagal menyimpan milestone.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!requireAuth()) return;
    try {
      await deleteMilestone(id);
      if (selectedId) await refreshDetail(selectedId);
      notify('info', 'Milestone dihapus.');
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus milestone.');
    }
  };

  const handleSaveLogbook = async (l: Partial<LogbookEntry>) => {
    if (!requireAuth()) return;
    try {
      await saveLogbook({ ...l, user_email: userEmail || l.user_email || '' });
      notify('success', 'Catatan tersimpan.');
      const [, logs] = await Promise.all([
        selectedId ? refreshDetail(selectedId) : Promise.resolve(),
        fetchRecentLogbooks(60),
      ]);
      setRecentLogs(logs);
    } catch (err) {
      handleWriteError(err, 'Gagal menyimpan catatan.');
    }
  };

  const handleDeleteLogbook = async (id: string) => {
    if (!requireAuth()) return;
    try {
      await deleteLogbook(id);
      if (selectedId) await refreshDetail(selectedId);
      setRecentLogs(await fetchRecentLogbooks(60));
      notify('info', 'Catatan dihapus.');
    } catch (err) {
      handleWriteError(err, 'Gagal menghapus catatan.');
    }
  };

  const handleAuthSuccess = (email: string) => {
    setUserEmail(email);
    setUserEmailState(email);
    setSelectedId(null);
    refreshAll();
    notify('success', `Masuk sebagai ${email}.`);
  };
  const handleSignedOut = () => {
    clearUserEmail();
    setUserEmailState('');
    setSelectedId(null);
    setDetail(null);
    refreshAll();
    notify('info', 'Anda keluar dari akun.');
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Latar dekoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 via-violet-200/40 to-sky-200/50 blur-3xl" />
        <div className="absolute right-[-6rem] top-64 hidden h-64 w-64 rounded-full bg-amber-100/50 blur-3xl lg:block" />
      </div>

      <div className="relative pt-3">
        <Topbar
          onOpenPalette={() => setPaletteOpen(true)}
          onNewProject={newProject}
          onOpenSettings={() => setSettingsOpen(true)}
          userEmail={userEmail}
          cloudActive={isSupabaseConfigured()}
          onOpenAuth={() => setAuthOpen(true)}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6">
        <main id="konten" className="pb-40 pt-5 sm:pt-7">
          {loading ? (
            <div className="space-y-3" aria-label="Memuat…">
              <div className="skeleton h-8 w-56" />
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          ) : !userEmail ? (
            <div className="mx-auto max-w-lg pt-10">
              <EmptyState
                icon={<LogIn className="h-6 w-6" aria-hidden="true" />}
                title="Masuk dulu untuk mulai"
                desc="Masuk dengan akun Anda agar data proyek, tugas, dan logbook tersimpan khusus untuk akun tersebut dan sinkron di semua perangkat."
                action={
                  <button
                    type="button"
                    onClick={() => setAuthOpen(true)}
                    className="btn-primary px-5 py-2.5 text-[13px]"
                  >
                    <LogIn className="h-4 w-4" aria-hidden="true" /> Masuk
                  </button>
                }
              />
            </div>
          ) : selectedId && detail ? (
            <ProjectDetail
              projectData={detail}
              onBack={() => setSelectedId(null)}
              onEditProject={(p) => {
                setEditing(p);
                setProjectModal(true);
              }}
              onDuplicate={handleDuplicate}
              onDeleteProject={handleDeleteProject}
              onStatusChange={handleStatus}
              onSaveTask={handleSaveTask}
              onDeleteTask={handleDeleteTask}
              onSaveMilestone={handleSaveMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onSaveLogbook={handleSaveLogbook}
              onDeleteLogbook={handleDeleteLogbook}
              onSaveSubtask={handleSaveSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onSaveComment={handleSaveComment}
              onDeleteComment={handleDeleteComment}
              onBulkStatus={handleBulkStatus}
              onBulkDelete={handleBulkDelete}
            />
          ) : selectedId ? (
            <div className="space-y-3" aria-label="Memuat…">
              <div className="skeleton h-8 w-48" />
              <SkeletonCard />
            </div>
          ) : view === 'today' ? (
            <TodayView
              groups={todayGroups}
              onToggleTask={handleToggleTask}
              onOpenProject={openProject}
              onNavigateDeadlines={() => goView('deadlines')}
            />
          ) : view === 'deadlines' ? (
            <DeadlinesView grouped={deadlineGroups} onOpenProject={openProject} />
          ) : view === 'activity' ? (
            <ActivityView logs={visibleLogs} projectName={projectName} onOpenProject={openProject} />
          ) : (
            <DashboardView
              userEmail={userEmail}
              projects={projects}
              recentLogs={visibleLogs}
              onOpenProject={openProject}
              onEdit={(p) => {
                setEditing(p);
                setProjectModal(true);
              }}
              onDuplicate={handleDuplicate}
              onDelete={handleDeleteProject}
              onStatusChange={handleStatus}
              onNewProject={newProject}
              onNavigate={goView}
              onDataChanged={() => {
                refreshAll();
                if (selectedId) refreshDetail(selectedId);
              }}
              notify={notify}
              onOpenAuth={() => setAuthOpen(true)}
            />
          )}

          <footer className="flex flex-col items-center justify-between gap-1.5 pb-2 pt-10 text-[11px] text-stone-400 sm:flex-row">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/70 bg-white/70 px-3 py-1 backdrop-blur">
              <span translate="no" className="font-semibold text-stone-600">Tracker Nexus</span>
              <span aria-hidden="true">•</span> kerja fokus, rapi tercatat
            </p>
            <p className="mono rounded-full border border-stone-200/70 bg-white/70 px-3 py-1 backdrop-blur">
              {isSupabaseConfigured() ? 'cloud sync aktif' : 'mode lokal'} • {new Date().getFullYear()}
            </p>
          </footer>
        </main>
      </div>

      <BottomNav
        view={view}
        onNavigate={goView}
        onNewProject={newProject}
        todayCount={todayCount}
        deadlineCount={deadlineCount}
        projectOpen={!!selectedId}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        projects={projects}
        onOpenProject={openProject}
        onNavigate={goView}
        onNewProject={newProject}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <ProjectModal
        open={projectModal}
        onClose={() => {
          setProjectModal(false);
          setEditing(null);
        }}
        onSave={handleSaveProject}
        projectToEdit={editing}
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        currentUserEmail={userEmail}
        onAuthSuccess={handleAuthSuccess}
        onSignedOut={handleSignedOut}
        notify={notify}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onDataChanged={() => {
          refreshAll();
          if (selectedId) refreshDetail(selectedId);
          else setDetail(null);
        }}
        notify={notify}
        onOpenAuth={() => setAuthOpen(true)}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
