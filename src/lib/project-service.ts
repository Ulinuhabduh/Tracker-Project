import { supabase, isSupabaseConfigured } from './supabase';
import { getUserEmail } from './user-session';
import {
  Project,
  Milestone,
  Task,
  LogbookEntry,
  ProjectDetailData,
} from './types';
import {
  INITIAL_PROJECTS,
  INITIAL_MILESTONES,
  INITIAL_TASKS,
  INITIAL_LOGBOOKS,
} from './mock-data';

const STORAGE_KEYS = {
  PROJECTS: 'track_progress_projects',
  MILESTONES: 'track_progress_milestones',
  TASKS: 'track_progress_tasks',
  LOGBOOKS: 'track_progress_logbooks',
};

function getLocal<T>(key: string, defaultVal: T[]): T[] {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage:`, err);
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error saving ${key} to localStorage:`, err);
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}

/** Wajib login sebelum tulis/ubah/hapus data. Dilempar ke UI untuk membuka AuthModal. */
export function requireLoginEmail(): string {
  const email = getUserEmail();
  if (!email) throw new Error('LOGIN_REQUIRED');
  return email;
}

/** Id proyek milik akun yang sedang masuk (dipakai untuk menyaring tugas/milestone/log). */
async function getOwnProjectIds(): Promise<Set<string>> {
  const projects = await fetchProjects();
  return new Set(projects.map((p) => p.id));
}

// ==========================================
// PROJECTS (STRICT PER-ACCOUNT: hanya milik akun yang masuk)
// ==========================================
export async function fetchProjects(): Promise<Project[]> {
  const currentEmail = getUserEmail();

  // Belum masuk: tidak tampilkan data apa pun (bukan demo / milik orang lain)
  if (!currentEmail) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_email', currentEmail)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Project[];
      }
      if (error) {
        console.warn('Supabase fetchProjects notice:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetchProjects exception:', err);
    }
  }

  // Fallback when .env.local not configured or offline
  const localList = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  return localList.filter((p) => p.user_email === currentEmail);
}

export async function fetchProjectDetail(id: string): Promise<ProjectDetailData | null> {
  // Belum masuk: tidak boleh membuka detail proyek apa pun
  const currentEmail = getUserEmail();
  if (!currentEmail) return null;

  if (isSupabaseConfigured()) {
    try {
      const [projRes, msRes, taskRes, logRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('milestones').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('logbooks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ]);

      if (!projRes.error && projRes.data) {
        const proj = projRes.data as Project;
        // Ownership guard: hanya proyek milik akun ini yang boleh dibuka
        if (proj.user_email !== currentEmail) return null;
        return {
          ...proj,
          milestones: (msRes.data as Milestone[]) || [],
          tasks: (taskRes.data as Task[]) || [],
          logbooks: (logRes.data as LogbookEntry[]) || [],
        };
      }
    } catch (err) {
      console.warn('Supabase fetchProjectDetail exception:', err);
    }
  }

  // Fallback
  const projects = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const project = projects.find((p) => p.id === id);
  if (!project) return null;
  // Ownership guard: hanya proyek milik akun ini yang boleh dibuka
  if (project.user_email !== currentEmail) return null;

  const allMilestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  const allTasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  const allLogbooks = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);

  return {
    ...project,
    milestones: allMilestones.filter((m) => m.project_id === id),
    tasks: allTasks.filter((t) => t.project_id === id),
    logbooks: allLogbooks.filter((l) => l.project_id === id),
  };
}

export async function saveProject(projectData: Partial<Project>): Promise<Project> {
  // Wajib masuk dulu sebelum tambah/ubah proyek
  const loginEmail = requireLoginEmail();
  const isNew = !projectData.id;
  const now = new Date().toISOString();
  const id = projectData.id || generateId();
  const userEmail = projectData.user_email || loginEmail;

  const projectRecord: Project = {
    id,
    user_email: userEmail,
    title: projectData.title?.trim() || 'Untitled Project',
    description: projectData.description?.trim() || '',
    category: projectData.category?.trim() || 'General',
    status: projectData.status || 'planning',
    priority: projectData.priority || 'medium',
    progress_percent: projectData.progress_percent ?? 0,
    start_date: projectData.start_date || now.split('T')[0],
    due_date: projectData.due_date || now.split('T')[0],
    tags: projectData.tags || [],
    created_at: projectData.created_at || now,
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    try {
      if (isNew) {
        const { data, error } = await supabase.from('projects').insert(projectRecord).select().single();
        if (!error && data) return data as Project;
        if (error) console.error('Supabase saveProject insert error:', error.message);
      } else {
        const { data, error } = await supabase
          .from('projects')
          .update(projectRecord)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Project;
        if (error) console.error('Supabase saveProject update error:', error.message);
      }
    } catch (err) {
      console.error('Supabase saveProject exception:', err);
    }
  }

  // Local fallback
  const list = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  let updatedList: Project[];
  if (isNew) {
    updatedList = [projectRecord, ...list];
  } else {
    updatedList = list.map((p) => (p.id === id ? projectRecord : p));
  }
  setLocal(STORAGE_KEYS.PROJECTS, updatedList);
  return projectRecord;
}

export async function deleteProject(id: string): Promise<boolean> {
  requireLoginEmail();
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteProject exception:', err);
    }
  }

  const list = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  setLocal(STORAGE_KEYS.PROJECTS, list.filter((p) => p.id !== id));

  const ms = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  setLocal(STORAGE_KEYS.MILESTONES, ms.filter((m) => m.project_id !== id));

  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  setLocal(STORAGE_KEYS.TASKS, tasks.filter((t) => t.project_id !== id));

  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  setLocal(STORAGE_KEYS.LOGBOOKS, logs.filter((l) => l.project_id !== id));

  return true;
}

// ==========================================
// TASKS & AUTOMATIC PROGRESS RECALCULATION
// ==========================================
export async function saveTask(taskData: Partial<Task>): Promise<Task> {
  requireLoginEmail();
  const isNew = !taskData.id;
  const now = new Date().toISOString();
  const id = taskData.id || generateId();

  const task: Task = {
    id,
    project_id: taskData.project_id!,
    milestone_id: taskData.milestone_id || null,
    title: taskData.title?.trim() || 'New Task',
    status: taskData.status || 'todo',
    priority: taskData.priority || 'medium',
    due_date: taskData.due_date,
    created_at: taskData.created_at || now,
  };

  if (isSupabaseConfigured()) {
    try {
      if (isNew) {
        await supabase.from('tasks').insert(task);
      } else {
        await supabase.from('tasks').update(task).eq('id', id);
      }
    } catch (err) {
      console.error('Supabase saveTask exception:', err);
    }
  }

  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  let updatedTasks: Task[];
  if (isNew) {
    updatedTasks = [...tasks, task];
  } else {
    updatedTasks = tasks.map((t) => (t.id === id ? task : t));
  }
  setLocal(STORAGE_KEYS.TASKS, updatedTasks);

  await recalculateProjectProgress(task.project_id);
  return task;
}

export async function deleteTask(id: string, projectId: string): Promise<boolean> {
  requireLoginEmail();
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteTask exception:', err);
    }
  }

  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  setLocal(STORAGE_KEYS.TASKS, tasks.filter((t) => t.id !== id));

  await recalculateProjectProgress(projectId);
  return true;
}

export async function recalculateProjectProgress(projectId: string): Promise<number> {
  let projectTasks: Task[] = [];

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('tasks').select('*').eq('project_id', projectId);
      if (data) projectTasks = data as Task[];
    } catch (err) {
      console.warn('recalculateProjectProgress Supabase notice:', err);
    }
  }

  if (projectTasks.length === 0) {
    const localTasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    projectTasks = localTasks.filter((t) => t.project_id === projectId);
  }

  if (projectTasks.length === 0) return 0;

  const completed = projectTasks.filter((t) => t.status === 'done').length;
  const progressPercent = Math.round((completed / projectTasks.length) * 100);

  let statusUpdate: Project['status'] | undefined;
  if (progressPercent === 100) {
    statusUpdate = 'completed';
  } else if (progressPercent > 0) {
    statusUpdate = 'in_progress';
  }

  if (isSupabaseConfigured()) {
    try {
      const payload: Record<string, unknown> = {
        progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      };
      if (statusUpdate) payload.status = statusUpdate;
      await supabase.from('projects').update(payload).eq('id', projectId);
    } catch (err) {
      console.warn('Supabase update progress notice:', err);
    }
  }

  const projects = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  const updatedProjects = projects.map((p) => {
    if (p.id === projectId) {
      return {
        ...p,
        progress_percent: progressPercent,
        status: statusUpdate || p.status,
        updated_at: new Date().toISOString(),
      };
    }
    return p;
  });
  setLocal(STORAGE_KEYS.PROJECTS, updatedProjects);

  return progressPercent;
}

// ==========================================
// MILESTONES
// ==========================================
export async function saveMilestone(milestoneData: Partial<Milestone>): Promise<Milestone> {
  requireLoginEmail();
  const isNew = !milestoneData.id;
  const now = new Date().toISOString();
  const id = milestoneData.id || generateId();

  const milestone: Milestone = {
    id,
    project_id: milestoneData.project_id!,
    title: milestoneData.title?.trim() || 'New Milestone',
    due_date: milestoneData.due_date,
    is_completed: milestoneData.is_completed ?? false,
    created_at: milestoneData.created_at || now,
  };

  if (isSupabaseConfigured()) {
    try {
      if (isNew) {
        await supabase.from('milestones').insert(milestone);
      } else {
        await supabase.from('milestones').update(milestone).eq('id', id);
      }
    } catch (err) {
      console.error('Supabase saveMilestone exception:', err);
    }
  }

  const milestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  let updated: Milestone[];
  if (isNew) {
    updated = [...milestones, milestone];
  } else {
    updated = milestones.map((m) => (m.id === id ? milestone : m));
  }
  setLocal(STORAGE_KEYS.MILESTONES, updated);
  return milestone;
}

export async function deleteMilestone(id: string): Promise<boolean> {
  requireLoginEmail();
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('milestones').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteMilestone exception:', err);
    }
  }

  const milestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  setLocal(STORAGE_KEYS.MILESTONES, milestones.filter((m) => m.id !== id));
  return true;
}

// ==========================================
// LOGBOOKS (WITH LIVE PREVIEW & USER EMAIL)
// ==========================================
export async function saveLogbook(logData: Partial<LogbookEntry>): Promise<LogbookEntry> {
  // Wajib masuk dulu sebelum tambah/ubah catatan
  const loginEmail = requireLoginEmail();
  const isNew = !logData.id;
  const now = new Date().toISOString();
  const id = logData.id || generateId();
  const userEmail = logData.user_email || loginEmail;

  const entry: LogbookEntry = {
    id,
    project_id: logData.project_id!,
    user_email: userEmail,
    title: logData.title?.trim() || 'Catatan Perkembangan',
    content_markdown: logData.content_markdown || '',
    log_type: logData.log_type || 'daily_update',
    blockers: logData.blockers?.trim() || '',
    author_name: logData.author_name?.trim() || userEmail.split('@')[0] || 'Project Owner',
    tags: logData.tags || [],
    created_at: logData.created_at || now,
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    try {
      if (isNew) {
        const { data, error } = await supabase.from('logbooks').insert(entry).select().single();
        if (!error && data) return data as LogbookEntry;
        if (error) console.error('Supabase saveLogbook insert error:', error.message);
      } else {
        const { data, error } = await supabase
          .from('logbooks')
          .update(entry)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as LogbookEntry;
        if (error) console.error('Supabase saveLogbook update error:', error.message);
      }
    } catch (err) {
      console.error('Supabase saveLogbook exception:', err);
    }
  }

  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  let updatedLogs: LogbookEntry[];
  if (isNew) {
    updatedLogs = [entry, ...logs];
  } else {
    updatedLogs = logs.map((l) => (l.id === id ? entry : l));
  }
  setLocal(STORAGE_KEYS.LOGBOOKS, updatedLogs);
  return entry;
}

export async function deleteLogbook(id: string): Promise<boolean> {
  requireLoginEmail();
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('logbooks').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteLogbook exception:', err);
    }
  }

  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  setLocal(STORAGE_KEYS.LOGBOOKS, logs.filter((l) => l.id !== id));
  return true;
}

// Push local data to Supabase under the given email
export async function syncLocalDataToSupabase(email: string): Promise<{ success: boolean; count: number }> {
  if (!isSupabaseConfigured() || !email) {
    return { success: false, count: 0 };
  }

  try {
    const localProjects = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    const localMilestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
    const localTasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const localLogs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);

    // Upsert projects with email
    const projectsWithEmail = localProjects.map((p) => ({ ...p, user_email: email }));
    await supabase.from('projects').upsert(projectsWithEmail);

    if (localMilestones.length > 0) {
      await supabase.from('milestones').upsert(localMilestones);
    }
    if (localTasks.length > 0) {
      await supabase.from('tasks').upsert(localTasks);
    }
    if (localLogs.length > 0) {
      const logsWithEmail = localLogs.map((l) => ({ ...l, user_email: email }));
      await supabase.from('logbooks').upsert(logsWithEmail);
    }

    return { success: true, count: localProjects.length };
  } catch (err) {
    console.error('syncLocalDataToSupabase error:', err);
    return { success: false, count: 0 };
  }
}

export async function deleteAllData(scope: 'all' | 'user_only' = 'all'): Promise<{ success: boolean; message: string }> {
  // Tindakan destruktif: wajib masuk dulu (mencegah wipe saat logout)
  const currentEmail = requireLoginEmail();

  if (isSupabaseConfigured()) {
    try {
      if (scope === 'user_only' && currentEmail) {
        // Delete user's projects in Supabase (cascades to tasks and milestones)
        const { error: projErr } = await supabase
          .from('projects')
          .delete()
          .eq('user_email', currentEmail);

        // Also delete user logbooks
        const { error: logErr } = await supabase
          .from('logbooks')
          .delete()
          .eq('user_email', currentEmail);

        if (projErr || logErr) {
          console.warn('Supabase partial delete warning:', projErr?.message || logErr?.message);
        }
      } else {
        // Delete all data in Supabase
        await supabase.from('tasks').delete().neq('id', '___');
        await supabase.from('milestones').delete().neq('id', '___');
        await supabase.from('logbooks').delete().neq('id', '___');
        await supabase.from('projects').delete().neq('id', '___');
      }
    } catch (err) {
      console.error('Supabase deleteAllData exception:', err);
    }
  }

  // Clear or wipe LocalStorage
  if (typeof window !== 'undefined') {
    if (scope === 'user_only' && currentEmail) {
      const projects = getLocal<Project>(STORAGE_KEYS.PROJECTS, []);
      const remainingProjects = projects.filter((p) => p.user_email !== currentEmail);
      setLocal(STORAGE_KEYS.PROJECTS, remainingProjects);

      const remainingIds = new Set(remainingProjects.map((p) => p.id));
      const milestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, []);
      setLocal(STORAGE_KEYS.MILESTONES, milestones.filter((m) => remainingIds.has(m.project_id)));

      const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, []);
      setLocal(STORAGE_KEYS.TASKS, tasks.filter((t) => remainingIds.has(t.project_id)));

      const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, []);
      setLocal(STORAGE_KEYS.LOGBOOKS, logs.filter((l) => remainingIds.has(l.project_id) && l.user_email !== currentEmail));
    } else {
      // Complete wipe
      setLocal(STORAGE_KEYS.PROJECTS, []);
      setLocal(STORAGE_KEYS.MILESTONES, []);
      setLocal(STORAGE_KEYS.TASKS, []);
      setLocal(STORAGE_KEYS.LOGBOOKS, []);
    }
  }

  return {
    success: true,
    message: scope === 'user_only' && currentEmail
      ? `Seluruh data proyek untuk akun ${currentEmail} telah berhasil dihapus.`
      : 'Seluruh data proyek, tugas, milestone, dan logbook berhasil dihapus bersih.',
  };
}

export function resetToInitialSeed(): void {
  if (typeof window === 'undefined') return;
  // Cap data contoh sebagai milik akun yang sedang masuk agar tampil di workspace-nya
  const email = getUserEmail() || '';
  const projects = INITIAL_PROJECTS.map((p) => ({ ...p, user_email: email || p.user_email }));
  const logbooks = INITIAL_LOGBOOKS.map((l) => ({ ...l, user_email: email || l.user_email }));
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(INITIAL_MILESTONES));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(STORAGE_KEYS.LOGBOOKS, JSON.stringify(logbooks));
}

// ==========================================
// CROSS-PROJECT QUERIES (dashboard views)
// ==========================================

/** All tasks across OWN projects, newest first. Single query — no N+1. */
export async function fetchAllTasks(): Promise<Task[]> {
  const currentEmail = getUserEmail();
  if (!currentEmail) return [];

  if (isSupabaseConfigured()) {
    try {
      const ownIds = await getOwnProjectIds();
      if (ownIds.size === 0) return [];
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .in('project_id', [...ownIds])
        .order('created_at', { ascending: false });
      if (!error && data) return data as Task[];
    } catch (err) {
      console.warn('fetchAllTasks Supabase notice:', err);
    }
  }
  const ownIds = await getOwnProjectIds();
  if (ownIds.size === 0) return [];
  return getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS).filter((t) => ownIds.has(t.project_id));
}

/** Most recent logbook entries across OWN projects. */
export async function fetchRecentLogbooks(limit = 12): Promise<LogbookEntry[]> {
  const currentEmail = getUserEmail();
  if (!currentEmail) return [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('logbooks')
        .select('*')
        .eq('user_email', currentEmail)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data as LogbookEntry[];
    } catch (err) {
      console.warn('fetchRecentLogbooks Supabase notice:', err);
    }
  }
  const ownIds = await getOwnProjectIds();
  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  return [...logs]
    .filter((l) => l.user_email === currentEmail && ownIds.has(l.project_id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

/** All milestones across OWN projects. */
export async function fetchAllMilestones(): Promise<Milestone[]> {
  const currentEmail = getUserEmail();
  if (!currentEmail) return [];

  if (isSupabaseConfigured()) {
    try {
      const ownIds = await getOwnProjectIds();
      if (ownIds.size === 0) return [];
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .in('project_id', [...ownIds]);
      if (!error && data) return data as Milestone[];
    } catch (err) {
      console.warn('fetchAllMilestones Supabase notice:', err);
    }
  }
  const ownIds = await getOwnProjectIds();
  if (ownIds.size === 0) return [];
  return getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES).filter((m) =>
    ownIds.has(m.project_id)
  );
}

/** Duplicate OWN project with its tasks & milestones under new ids. */
export async function duplicateProject(id: string): Promise<Project | null> {
  requireLoginEmail();
  const detail = await fetchProjectDetail(id);
  if (!detail) return null;
  const now = new Date().toISOString();
  const copy = await saveProject({
    title: `${detail.title} (salinan)`,
    description: detail.description,
    category: detail.category,
    status: 'planning',
    priority: detail.priority,
    progress_percent: 0,
    start_date: now.split('T')[0],
    due_date: detail.due_date,
    tags: detail.tags,
    user_email: detail.user_email,
  });
  for (const m of detail.milestones) {
    await saveMilestone({
      project_id: copy.id,
      title: m.title,
      due_date: m.due_date,
      is_completed: false,
    });
  }
  for (const t of detail.tasks) {
    await saveTask({
      project_id: copy.id,
      title: t.title,
      status: 'todo',
      priority: t.priority,
      due_date: t.due_date,
    });
  }
  return copy;
}

// ==========================================
// BACKUP: EXPORT / IMPORT JSON
// ==========================================

export interface BackupPayload {
  app: 'trackpro';
  version: 1;
  exported_at: string;
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  logbooks: LogbookEntry[];
}

/** Gather the full visible workspace into one portable JSON object. */
export async function exportAllData(): Promise<BackupPayload> {
  const [projects, tasks, milestones, logbooks] = await Promise.all([
    fetchProjects(),
    fetchAllTasks(),
    fetchAllMilestones(),
    fetchRecentLogbooks(500),
  ]);
  // Only include items belonging to visible projects (never leak other accounts)
  const ids = new Set(projects.map((p) => p.id));
  return {
    app: 'trackpro',
    version: 1,
    exported_at: new Date().toISOString(),
    projects,
    milestones: milestones.filter((m) => ids.has(m.project_id)),
    tasks: tasks.filter((t) => ids.has(t.project_id)),
    logbooks: logbooks.filter((l) => ids.has(l.project_id)),
  };
}

/** Restore a backup file. Returns counts per collection. */
export async function importAllData(
  payload: BackupPayload
): Promise<{ success: boolean; message: string }> {
  // Pulihkan backup = tulis data: wajib masuk dulu
  const loginEmail = requireLoginEmail();
  try {
    if (!payload || payload.app !== 'trackpro' || !Array.isArray(payload.projects)) {
      return { success: false, message: 'File bukan backup Tracker Nexus yang valid.' };
    }
    // Cap semua data impor sebagai milik akun ini agar tidak bocor antar-akun
    const projects = payload.projects.map((p) => ({ ...p, user_email: loginEmail }));
    const logbooks = (payload.logbooks || []).map((l) => ({ ...l, user_email: loginEmail }));
    setLocal(STORAGE_KEYS.PROJECTS, projects);
    setLocal(STORAGE_KEYS.MILESTONES, payload.milestones || []);
    setLocal(STORAGE_KEYS.TASKS, payload.tasks || []);
    setLocal(STORAGE_KEYS.LOGBOOKS, logbooks);

    if (isSupabaseConfigured()) {
      try {
        if (projects.length > 0) await supabase.from('projects').upsert(projects);
        if ((payload.milestones || []).length > 0) await supabase.from('milestones').upsert(payload.milestones);
        if ((payload.tasks || []).length > 0) await supabase.from('tasks').upsert(payload.tasks);
        if (logbooks.length > 0) await supabase.from('logbooks').upsert(logbooks);
      } catch (err) {
        console.warn('importAllData cloud sync notice:', err);
      }
    }
    return {
      success: true,
      message: `Backup dipulihkan: ${payload.projects.length} proyek, ${(payload.tasks || []).length} tugas, ${(payload.logbooks || []).length} log.`,
    };
  } catch (err) {
    console.error('importAllData error:', err);
    return { success: false, message: 'Gagal membaca file backup.' };
  }
}

