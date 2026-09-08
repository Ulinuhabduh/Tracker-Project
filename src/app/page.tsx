'use client';

import React from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  FolderGit2, 
  Sparkles, 
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  Database,
  Cloud,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { 
  Project, 
  ProjectDetailData, 
  Task, 
  Milestone, 
  LogbookEntry, 
  ProjectStatus, 
  ProjectPriority 
} from '@/lib/types';
import { 
  fetchProjects, 
  fetchProjectDetail, 
  saveProject, 
  deleteProject, 
  saveTask, 
  deleteTask, 
  saveMilestone, 
  deleteMilestone, 
  saveLogbook, 
  deleteLogbook,
  resetToInitialSeed 
} from '@/lib/project-service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getUserEmail, setUserEmail, clearUserEmail } from '@/lib/user-session';
import { Header } from '@/components/Header';
import { StatsOverview } from '@/components/StatsOverview';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectModal } from '@/components/ProjectModal';
import { ProjectDetail } from '@/components/ProjectDetail';
import { SupabaseConfigModal } from '@/components/SupabaseConfigModal';
import { AuthModal } from '@/components/AuthModal';
import { ClearDataModal } from '@/components/ClearDataModal';
import { ToastContainer, ToastMessage } from '@/components/Toast';

export default function Home() {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [activeProjectDetail, setActiveProjectDetail] = React.useState<ProjectDetailData | null>(null);
  const [userEmail, setUserEmailState] = React.useState('');

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'updated' | 'deadline' | 'progress' | 'title'>('updated');

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
  const [projectToEdit, setProjectToEdit] = React.useState<Project | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = React.useState(false);

  // Toast & Loading
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = 'toast-' + Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load projects list
  const loadProjects = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
      addToast('error', 'Gagal memuat daftar proyek.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load single project detail
  const loadDetail = React.useCallback(async (id: string) => {
    try {
      const detail = await fetchProjectDetail(id);
      setActiveProjectDetail(detail);
    } catch (err) {
      console.error('Failed to load project detail:', err);
      addToast('error', 'Gagal memuat rincian proyek.');
    }
  }, []);

  // Check Supabase Auth state on mount
  React.useEffect(() => {
    const saved = getUserEmail();
    setUserEmailState(saved);
    loadProjects();

    if (isSupabaseConfigured()) {
      // Check current auth session
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user?.email) {
          const verifiedEmail = data.user.email.toLowerCase();
          setUserEmail(verifiedEmail);
          setUserEmailState(verifiedEmail);
        }
      });

      // Listen for auth state changes (login / logout)
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (session?.user?.email) {
            const verifiedEmail = session.user.email.toLowerCase();
            setUserEmail(verifiedEmail);
            setUserEmailState(verifiedEmail);
            loadProjects();
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [loadProjects]);

  React.useEffect(() => {
    if (selectedProjectId) {
      loadDetail(selectedProjectId);
    } else {
      setActiveProjectDetail(null);
    }
  }, [selectedProjectId, loadDetail]);

  // Auth Handlers
  const handleAuthSuccess = (email: string) => {
    setUserEmail(email);
    setUserEmailState(email);
    loadProjects();
    addToast('success', `Berhasil masuk & terproteksi: ${email}`);
  };

  const handleSignedOut = () => {
    clearUserEmail();
    setUserEmailState('');
    loadProjects();
    addToast('info', 'Anda telah keluar dari akun.');
  };

  // Handle data completely wiped
  const handleDataCleared = (message: string) => {
    setSelectedProjectId(null);
    setActiveProjectDetail(null);
    loadProjects();
    addToast('info', message);
  };

  // Project handlers
  const handleSaveProject = async (data: Partial<Project>) => {
    try {
      const saved = await saveProject({
        ...data,
        user_email: userEmail || data.user_email || '',
      });
      addToast('success', `Proyek "${saved.title}" berhasil disimpan!`);
      await loadProjects();
      if (selectedProjectId === saved.id) {
        await loadDetail(saved.id);
      }
    } catch (err) {
      addToast('error', 'Gagal menyimpan proyek.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id);
      addToast('info', 'Proyek telah dihapus.');
      if (selectedProjectId === id) {
        setSelectedProjectId(null);
      }
      await loadProjects();
    } catch (err) {
      addToast('error', 'Gagal menghapus proyek.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: ProjectStatus) => {
    try {
      await saveProject({ id, status: newStatus });
      addToast('success', 'Status proyek diperbarui.');
      await loadProjects();
      if (selectedProjectId === id) {
        await loadDetail(id);
      }
    } catch (err) {
      addToast('error', 'Gagal memperbarui status proyek.');
    }
  };

  // Task handlers
  const handleSaveTask = async (taskData: Partial<Task>) => {
    try {
      await saveTask(taskData);
      addToast('success', 'Task berhasil diperbarui.');
      if (selectedProjectId) {
        await loadDetail(selectedProjectId);
        await loadProjects();
      }
    } catch (err) {
      addToast('error', 'Gagal menyimpan task.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProjectId) return;
    try {
      await deleteTask(taskId, selectedProjectId);
      addToast('info', 'Task dihapus.');
      await loadDetail(selectedProjectId);
      await loadProjects();
    } catch (err) {
      addToast('error', 'Gagal menghapus task.');
    }
  };

  // Milestone handlers
  const handleSaveMilestone = async (msData: Partial<Milestone>) => {
    try {
      await saveMilestone(msData);
      addToast('success', 'Milestone berhasil diperbarui.');
      if (selectedProjectId) {
        await loadDetail(selectedProjectId);
      }
    } catch (err) {
      addToast('error', 'Gagal menyimpan milestone.');
    }
  };

  const handleDeleteMilestone = async (msId: string) => {
    try {
      await deleteMilestone(msId);
      addToast('info', 'Milestone dihapus.');
      if (selectedProjectId) {
        await loadDetail(selectedProjectId);
      }
    } catch (err) {
      addToast('error', 'Gagal menghapus milestone.');
    }
  };

  // Logbook handlers (with Live Preview & email)
  const handleSaveLogbook = async (logData: Partial<LogbookEntry>) => {
    try {
      await saveLogbook({
        ...logData,
        user_email: userEmail || logData.user_email || '',
      });
      addToast('success', 'Entri logbook berhasil direkam!');
      if (selectedProjectId) {
        await loadDetail(selectedProjectId);
      }
    } catch (err) {
      addToast('error', 'Gagal menyimpan catatan logbook.');
    }
  };

  const handleDeleteLogbook = async (logId: string) => {
    try {
      await deleteLogbook(logId);
      addToast('info', 'Entri logbook dihapus.');
      if (selectedProjectId) {
        await loadDetail(selectedProjectId);
      }
    } catch (err) {
      addToast('error', 'Gagal menghapus catatan logbook.');
    }
  };

  const handleResetData = () => {
    if (confirm('Muat ulang seluruh data contoh awal default (seed demo)?')) {
      resetToInitialSeed();
      addToast('info', 'Data lokal dimuat ulang ke contoh demo default.');
      setSelectedProjectId(null);
      loadProjects();
    }
  };

  const categories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));

  const filteredProjects = projects
    .filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchCategory = p.category?.toLowerCase().includes(q);
        return matchTitle || matchDesc || matchTags || matchCategory;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sortBy === 'progress') {
        return (b.progress_percent || 0) - (a.progress_percent || 0);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      {/* Top Header */}
      <Header
        onNewProject={() => {
          setProjectToEdit(null);
          setIsProjectModalOpen(true);
        }}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onResetData={handleResetData}
        onOpenClearData={() => setIsClearDataModalOpen(true)}
        userEmail={userEmail}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {selectedProjectId && activeProjectDetail ? (
          /* WORKSPACE VIEW: Selected Project */
          <ProjectDetail
            projectData={activeProjectDetail}
            onBack={() => setSelectedProjectId(null)}
            onEditProject={(proj) => {
              setProjectToEdit(proj);
              setIsProjectModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            onStatusChange={handleStatusChange}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
            onSaveMilestone={handleSaveMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onSaveLogbook={handleSaveLogbook}
            onDeleteLogbook={handleDeleteLogbook}
          />
        ) : (
          /* DASHBOARD VIEW: Portfolio Overview */
          <div className="animate-fade-in space-y-8">
            {/* Top Hero & KPI Cards */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Progress Portfolio Dashboard
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    Pantau metrik kecepatan sprint, pencapaian milestone, dan logbook terintegrasi Supabase
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setProjectToEdit(null);
                      setIsProjectModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Proyek</span>
                  </button>
                </div>
              </div>

              {/* Secure Auth Banner if not authenticated */}
              {!userEmail && (
                <div 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="mb-6 p-3.5 sm:p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-zinc-900 to-indigo-950/30 hover:border-indigo-500/50 cursor-pointer text-xs text-indigo-300 flex items-center justify-between gap-3 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <ShieldCheck className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        Ingin data Anda terproteksi aman antar-device?
                      </span>
                      <p className="text-indigo-200/80 text-[11px] mt-0.5">
                        Masuk dengan Email & Kata Sandi agar data proyek Anda terproteksi dan tersinkronisasi aman.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-white shrink-0 underline">
                    Masuk Sekarang →
                  </span>
                </div>
              )}

              {/* KPI Cards */}
              <StatsOverview projects={projects} />
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Cari berdasarkan nama proyek, teknologi, deskripsi, atau tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-300 text-xs">
                    <ArrowUpDown className="h-3.5 w-3.5 text-zinc-500" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-zinc-300 text-xs focus:outline-none"
                    >
                      <option value="updated">Terbaru Diperbarui</option>
                      <option value="deadline">Mendekati Deadline</option>
                      <option value="progress">Progres Tertinggi</option>
                      <option value="title">Nama Proyek (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-zinc-850">
                <span className="text-[11px] font-mono text-zinc-400 mr-1 hidden sm:inline">
                  Status:
                </span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'all'
                      ? 'bg-zinc-800 text-white font-medium shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Semua ({projects.length})
                </button>
                <button
                  onClick={() => setStatusFilter('in_progress')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'in_progress'
                      ? 'bg-sky-500/20 text-sky-300 font-medium border border-sky-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Sedang Berjalan
                </button>
                <button
                  onClick={() => setStatusFilter('planning')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'planning'
                      ? 'bg-zinc-700 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Perencanaan
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Selesai
                </button>
                <button
                  onClick={() => setStatusFilter('on_hold')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    statusFilter === 'on_hold'
                      ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  Tertunda
                </button>
              </div>
            </div>

            {/* Projects Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-6 h-56 border border-zinc-800 animate-pulse"
                  >
                    <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4" />
                    <div className="h-6 bg-zinc-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-zinc-800 rounded w-full mb-6" />
                    <div className="h-2 bg-zinc-800 rounded-full w-full mt-auto" />
                  </div>
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border border-zinc-800/80">
                <FolderGit2 className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">Tidak ada proyek yang ditemukan</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Coba sesuaikan filter atau kata kunci pencarian Anda.'
                    : 'Portfolio kosong atau seluruh data telah dibersihkan. Buat proyek baru sekarang!'}
                </p>
                <button
                  onClick={() => {
                    setProjectToEdit(null);
                    setIsProjectModalOpen(true);
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Proyek Baru</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={(p) => setSelectedProjectId(p.id)}
                    onEdit={(p) => {
                      setProjectToEdit(p);
                      setIsProjectModalOpen(true);
                    }}
                    onDelete={handleDeleteProject}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setProjectToEdit(null);
        }}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigChanged={() => {
          loadProjects();
          if (selectedProjectId) loadDetail(selectedProjectId);
          addToast('success', 'Pengaturan koneksi Supabase diperbarui.');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUserEmail={userEmail}
        onAuthSuccess={handleAuthSuccess}
        onSignedOut={handleSignedOut}
      />

      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onDataCleared={handleDataCleared}
      />

      {/* Toast Feedback */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
