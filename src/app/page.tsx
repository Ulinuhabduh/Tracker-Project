'use client';

import React from 'react';
import type {
  LogbookEntry,
  Milestone,
  Project,
  ProjectDetailData,
  ProjectStatus,
  Task,
} from '@/lib/types';
import {
  deleteLogbook,
  deleteMilestone,
  deleteProject,
  deleteTask,
  duplicateProject,
  fetchAllTasks,
  fetchProjectDetail,
  fetchProjects,
  fetchRecentLogbooks,
  saveLogbook,
  saveMilestone,
  saveProject,
  saveTask,
} from '@/lib/project-service';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { clearUserEmail, getUserEmail, setUserEmail } from '@/lib/user-session';
import { groupProjectsByDeadline, groupTasksForToday } from '@/lib/dashboard-utils';
import { Sidebar } from '@/components/Sidebar';
import { MobileNewButton, Topbar } from '@/components/Topbar';
import { BottomNav } from '@/components/BottomNav';
import { CommandPalette } from '@/components/CommandPalette';
import { ProjectDetail } from '@/components/ProjectDetail';
import { ProjectModal } from '@/components/ProjectModal';
import { AuthModal } from '@/components/AuthModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ToastContainer, type ToastMessage } from '@/components/Toast';
import { SkeletonCard } from '@/components/ui';
import { DashboardView } from '@/components/views/DashboardView';
import { TodayView } from '@/components/views/TodayView';
import { DeadlinesView } from '@/components/views/DeadlinesView';
import { ActivityView } from '@/components/views/ActivityView';
import type { ViewKey } from '@/components/navigation';

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
    } catch {
      notify('error', 'Gagal memuat data. Coba muat ulang halaman.');
    }
  }, [notify]);

  const refreshDetail = React.useCallback(
    async (id: string) => {
      try {
        setDetail(await fetchProjectDetail(id));
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
      const confirmed =
        data?.user?.email_confirmed_at ||
        (data?.user as unknown as { confirmed_at?: string })?.confirmed_at;
      if (email && confirmed) {
        const v = email.toLowerCase();
        setUserEmail(v);
        setUserEmailState(v);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const email = session?.user?.email;
      const confirmed =
        session?.user?.email_confirmed_at ||
        (session?.user as unknown as { confirmed_at?: string })?.confirmed_at;
      if (email && confirmed) {
        const v = email.toLowerCase();
        setUserEmail(v);
        setUserEmailState(v);
        refreshAll();
        if (event === 'SIGNED_IN') notify('success', `Masuk sebagai ${v}.`);
      } else if (event === 'SIGNED_OUT') {
        clearUserEmail();
        setUserEmailState('');
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
  const todayGroups = React.useMemo(() => groupTasksForToday(allTasks, projects), [allTasks, projects]);
  const deadlineGroups = React.useMemo(() => groupProjectsByDeadline(projects), [projects]);
  const todayCount = todayGroups.overdue.length + todayGroups.today.length;
  const deadlineCount = deadlineGroups.overdue.length + deadlineGroups.week.length;
  const projectName = React.useCallback(
    (id: string) => projects.find((p) => p.id === id)?.title || 'Proyek',
    [projects]
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
    setEditing(null);
    setProjectModal(true);
    setPaletteOpen(false);
  }, []);

  // ---- mutations ----
  const handleSaveProject = async (data: Partial<Project>) => {
    try {
      const saved = await saveProject({ ...data, user_email: userEmail || data.user_email || '' });
      notify('success', `Proyek “${saved.title}” tersimpan.`);
      await refreshAll();
      if (selectedId === saved.id) await refreshDetail(saved.id);
    } catch {
      notify('error', 'Gagal menyimpan proyek. Coba lagi.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!window.confirm(`Hapus proyek “${target?.title || ''}” beserta tugas & logbook-nya?`)) return;
    try {
      await deleteProject(id);
      notify('info', 'Proyek dihapus.');
      if (selectedId === id) setSelectedId(null);
      await refreshAll();
    } catch {
      notify('error', 'Gagal menghapus proyek.');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const copy = await duplicateProject(id);
      if (copy) {
        notify('success', `Duplikat dibuat: “${copy.title}”.`);
        await refreshAll();
      }
    } catch {
      notify('error', 'Gagal menduplikat proyek.');
    }
  };

  const handleStatus = async (id: string, status: ProjectStatus) => {
    try {
      await saveProject({ id, status });
      notify('success', 'Status proyek diperbarui.');
      await refreshAll();
      if (selectedId === id) await refreshDetail(id);
    } catch {
      notify('error', 'Gagal memperbarui status.');
    }
  };

  const afterTaskChange = async () => {
    await Promise.all([refreshAll(), selectedId ? refreshDetail(selectedId) : Promise.resolve()]);
  };

  const handleSaveTask = async (t: Partial<Task>) => {
    try {
      await saveTask(t);
      await afterTaskChange();
    } catch {
      notify('error', 'Gagal menyimpan tugas.');
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await saveTask({
        id: task.id,
        project_id: task.project_id,
        status: task.status === 'done' ? 'todo' : 'done',
      });
      await refreshAll();
      if (selectedId) await refreshDetail(selectedId);
    } catch {
      notify('error', 'Gagal mengubah status tugas.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!selectedId) return;
    try {
      await deleteTask(id, selectedId);
      await afterTaskChange();
      notify('info', 'Tugas dihapus.');
    } catch {
      notify('error', 'Gagal menghapus tugas.');
    }
  };

  const handleSaveMilestone = async (m: Partial<Milestone>) => {
    try {
      await saveMilestone(m);
      if (selectedId) await refreshDetail(selectedId);
    } catch {
      notify('error', 'Gagal menyimpan milestone.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    try {
      await deleteMilestone(id);
      if (selectedId) await refreshDetail(selectedId);
      notify('info', 'Milestone dihapus.');
    } catch {
      notify('error', 'Gagal menghapus milestone.');
    }
  };

  const handleSaveLogbook = async (l: Partial<LogbookEntry>) => {
    try {
      await saveLogbook({ ...l, user_email: userEmail || l.user_email || '' });
      notify('success', 'Catatan tersimpan.');
      const [, logs] = await Promise.all([
        selectedId ? refreshDetail(selectedId) : Promise.resolve(),
        fetchRecentLogbooks(60),
      ]);
      setRecentLogs(logs);
    } catch {
      notify('error', 'Gagal menyimpan catatan.');
    }
  };

  const handleDeleteLogbook = async (id: string) => {
    try {
      await deleteLogbook(id);
      if (selectedId) await refreshDetail(selectedId);
      setRecentLogs(await fetchRecentLogbooks(60));
      notify('info', 'Catatan dihapus.');
    } catch {
      notify('error', 'Gagal menghapus catatan.');
    }
  };

  const handleAuthSuccess = (email: string) => {
    setUserEmail(email);
    setUserEmailState(email);
    refreshAll();
    notify('success', `Masuk sebagai ${email}.`);
  };
  const handleSignedOut = () => {
    clearUserEmail();
    setUserEmailState('');
    refreshAll();
    notify('info', 'Anda keluar dari akun.');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar
        view={view}
        onNavigate={goView}
        projects={projects}
        activeProjectId={selectedId}
        onOpenProject={openProject}
        todayCount={todayCount}
        deadlineCount={deadlineCount}
        userEmail={userEmail}
        cloudActive={isSupabaseConfigured()}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onNewProject={newProject}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onOpenPalette={() => setPaletteOpen(true)}
          onNewProject={newProject}
          userEmail={userEmail}
          onOpenAuth={() => setAuthOpen(true)}
        />

        <main id="konten" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:pb-12">
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
            <ActivityView logs={recentLogs} projectName={projectName} onOpenProject={openProject} />
          ) : (
            <DashboardView
              userEmail={userEmail}
              projects={projects}
              recentLogs={recentLogs}
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
            />
          )}

          <footer className="flex flex-col items-center justify-between gap-1 pb-2 pt-10 text-[11px] text-stone-400 sm:flex-row">
            <p>
              <span translate="no">Tracker Nexus</span> — kerja fokus, rapi tercatat.
            </p>
            <p className="mono">
              {isSupabaseConfigured() ? 'cloud sync aktif' : 'mode lokal'} • {new Date().getFullYear()}
            </p>
          </footer>
        </main>
      </div>

      <BottomNav view={view} onNavigate={goView} todayCount={todayCount} deadlineCount={deadlineCount} />
      {!selectedId ? <MobileNewButton onClick={newProject} /> : null}

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
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
