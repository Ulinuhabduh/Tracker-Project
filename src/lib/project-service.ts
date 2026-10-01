import { supabase, isSupabaseConfigured } from './supabase';
import { getUserEmail, getActorName } from './user-session';
import {
  ActivityAction,
  ActivityLog,
  Project,
  Milestone,
  Subtask,
  Task,
  TaskComment,
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
  SUBTASKS: 'track_progress_subtasks',
  COMMENTS: 'track_progress_comments',
  ACTIVITIES: 'track_progress_activities',
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
// KETAHANAN CLOUD: tulis gagal → baca lokal sementara (jangan tampil basi)
// Supabase-js TIDAK melempar error API (dikembalikan di { error }), jadi semua
// tulis WAJIB cek error. Kalau cloud gagal (mis. skema belum dimigrasi /
// offline), tandai degraded agar baca berikutnya pakai data lokal yang baru,
// dan simpan 1 peringatan untuk ditampilkan sebagai toast oleh UI.
// ==========================================
let cloudDegraded = false;
let cloudWarning: string | null = null;

export function isCloudDegraded(): boolean {
  return cloudDegraded;
}

/** Ambil (sekali saja) peringatan sinkron untuk ditampilkan ke pengguna. */
export function takeCloudWarning(): string | null {
  const w = cloudWarning;
  cloudWarning = null;
  return w;
}

function flagCloudIssue(err: unknown, context: string): void {
  cloudDegraded = true;
  const msg =
    err instanceof Error
      ? err.message
      : (err as { message?: string } | null)?.message || String(err);
  console.warn(`Supabase ${context} gagal, pakai lokal sementara:`, msg);
  cloudWarning =
    'Perubahan tersimpan di perangkat, tapi gagal sinkron ke cloud. Cek koneksi internet, atau jalankan blok MIGRASI FITUR di supabase/schema.sql sekali di SQL Editor Supabase.';
}

function markCloudOk(): void {
  cloudDegraded = false;
}

/** Payload aman untuk cloud: hanya kolom skema awal (audit hanya lokal sampai migrasi). */
function cloudTaskPayload(t: Task): Record<string, unknown> {
  return {
    id: t.id,
    project_id: t.project_id,
    milestone_id: t.milestone_id ?? null,
    title: t.title,
    status: t.status,
    priority: t.priority,
    due_date: t.due_date ?? null,
    created_at: t.created_at,
  };
}

/** Payload aman untuk cloud: tanpa kolom audit lokal. */
function cloudProjectPayload(p: Project): Record<string, unknown> {
  return {
    id: p.id,
    user_email: p.user_email,
    title: p.title,
    description: p.description,
    category: p.category,
    status: p.status,
    priority: p.priority,
    progress_percent: p.progress_percent,
    start_date: p.start_date,
    due_date: p.due_date,
    tags: p.tags,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

// ==========================================
// ACTIVITY LOG (audit trail: siapa, berbuat apa, kapan)
// Satu akun dipakai bareng → penulis diambil dari nama tampilan per perangkat.
// ==========================================
export async function logActivity(
  projectId: string,
  action: ActivityAction,
  entityType: ActivityLog['entity_type'],
  entityTitle: string,
  opts?: { entityId?: string; detail?: string; actorName?: string }
): Promise<void> {
  if (!projectId) return;
  const now = new Date().toISOString();
  const entry: ActivityLog = {
    id: generateId(),
    project_id: projectId,
    actor_name: opts?.actorName || getActorName(),
    action,
    entity_type: entityType,
    entity_id: opts?.entityId || '',
    entity_title: entityTitle,
    detail: opts?.detail || '',
    created_at: now,
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('activity_logs').insert(entry);
    } catch {
      /* tabel mungkin belum ada (jalankan migrasi schema.sql) — lokal tetap jalan */
    }
  }

  const list = getLocal<ActivityLog>(STORAGE_KEYS.ACTIVITIES, []);
  // Batasi total agar penyimpanan lokal tidak membengkak
  setLocal(STORAGE_KEYS.ACTIVITIES, [entry, ...list].slice(0, 2000));
}

/** Jejak aktivitas satu proyek, terbaru dulu. */
export async function fetchActivities(projectId: string, limit = 100): Promise<ActivityLog[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data as ActivityLog[];
    } catch {
      /* fallback lokal */
    }
  }
  return getLocal<ActivityLog>(STORAGE_KEYS.ACTIVITIES, [])
    .filter((a) => a.project_id === projectId)
    .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
    .slice(0, limit);
}

// ==========================================
// PROJECTS (STRICT PER-ACCOUNT: hanya milik akun yang masuk)
// ==========================================
export async function fetchProjects(): Promise<Project[]> {
  const currentEmail = getUserEmail();

  // Belum masuk: tidak tampilkan data apa pun (bukan demo / milik orang lain)
  if (!currentEmail) return [];

  if (isSupabaseConfigured() && !cloudDegraded) {
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

  if (isSupabaseConfigured() && !cloudDegraded) {
    try {
      const [projRes, msRes, taskRes, logRes, subRes, comRes, actRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('milestones').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('logbooks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
        supabase.from('subtasks').select('*').eq('project_id', id).order('position', { ascending: true }),
        supabase.from('task_comments').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('activity_logs').select('*').eq('project_id', id).order('created_at', { ascending: false }).limit(100),
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
          subtasks: (!subRes.error && subRes.data ? (subRes.data as Subtask[]) : getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => s.project_id === id)),
          comments: (!comRes.error && comRes.data ? (comRes.data as TaskComment[]) : getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => c.project_id === id)),
          activities: (!actRes.error && actRes.data ? (actRes.data as ActivityLog[]) : await fetchActivities(id)),
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
    subtasks: getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => s.project_id === id),
    comments: getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => c.project_id === id),
    activities: await fetchActivities(id),
  };
}

export async function saveProject(projectData: Partial<Project>): Promise<Project> {
  // Wajib masuk dulu sebelum tambah/ubah proyek
  const loginEmail = requireLoginEmail();
  const isNew = !projectData.id;
  const now = new Date().toISOString();
  const id = projectData.id || generateId();

  if (isNew) {
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
        const { data, error } = await supabase.from('projects').insert(cloudProjectPayload(projectRecord)).select().single();
        if (!error && data) {
          markCloudOk();
          return data as Project;
        }
        if (error) flagCloudIssue(error, 'saveProject insert');
      } catch (err) {
        flagCloudIssue(err, 'saveProject insert');
      }
    }

    const list = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    setLocal(STORAGE_KEYS.PROJECTS, [projectRecord, ...list]);
    return projectRecord;
  }

  // ---- update parsial: field yang tidak dikirim dipertahankan ----
  const list = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  let existing = list.find((p) => p.id === id);
  if (!existing && isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('projects').select('*').eq('id', id).single();
      if (data) existing = data as Project;
    } catch {
      /* abaikan */
    }
  }
  const base: Project = existing ?? {
    id,
    user_email: projectData.user_email || loginEmail,
    title: 'Untitled Project',
    description: '',
    category: 'General',
    status: 'planning',
    priority: 'medium',
    progress_percent: 0,
    start_date: now.split('T')[0],
    due_date: now.split('T')[0],
    tags: [],
    created_at: now,
    updated_at: now,
  };

  const projectRecord: Project = {
    ...base,
    id,
    user_email: projectData.user_email ?? base.user_email,
    title: projectData.title !== undefined ? projectData.title.trim() || base.title : base.title,
    description:
      projectData.description !== undefined ? projectData.description.trim() : base.description,
    category:
      projectData.category !== undefined ? projectData.category.trim() || base.category : base.category,
    status: projectData.status ?? base.status,
    priority: projectData.priority ?? base.priority,
    progress_percent: projectData.progress_percent ?? base.progress_percent,
    start_date: projectData.start_date ?? base.start_date,
    due_date: projectData.due_date ?? base.due_date,
    tags: projectData.tags ?? base.tags,
    created_at: base.created_at || now,
    updated_at: now,
    updated_by: getActorName(),
  };

  if ((existing?.status ?? base.status) !== projectRecord.status) {
    await logActivity(id, 'project_status', 'project', projectRecord.title, {
      entityId: id,
      detail: `${existing?.status ?? base.status} → ${projectRecord.status}`,
    });
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(cloudProjectPayload(projectRecord))
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        markCloudOk();
        return data as Project;
      }
      if (error) flagCloudIssue(error, 'saveProject update');
    } catch (err) {
      flagCloudIssue(err, 'saveProject update');
    }
  }

  // Local fallback
  const found = list.some((p) => p.id === id);
  setLocal(
    STORAGE_KEYS.PROJECTS,
    found ? list.map((p) => (p.id === id ? projectRecord : p)) : [projectRecord, ...list]
  );
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

  setLocal(
    STORAGE_KEYS.SUBTASKS,
    getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => s.project_id !== id)
  );
  setLocal(
    STORAGE_KEYS.COMMENTS,
    getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => c.project_id !== id)
  );
  setLocal(
    STORAGE_KEYS.ACTIVITIES,
    getLocal<ActivityLog>(STORAGE_KEYS.ACTIVITIES, []).filter((a) => a.project_id !== id)
  );

  return true;
}

// ==========================================
// TASKS & AUTOMATIC PROGRESS RECALCULATION
// Update bersifat parsial: field yang tidak dikirim tetap dipertahankan
// agar ubah status tidak mereset judul menjadi "New Task".
// ==========================================
export async function saveTask(taskData: Partial<Task>, opts?: { silent?: boolean }): Promise<Task> {
  requireLoginEmail();
  const isNew = !taskData.id;
  const now = new Date().toISOString();
  const id = taskData.id || generateId();
  const actor = getActorName();

  if (isNew) {
    const task: Task = {
      id,
      project_id: taskData.project_id!,
      milestone_id: taskData.milestone_id || null,
      title: taskData.title?.trim() || 'New Task',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date,
      created_at: taskData.created_at || now,
      updated_at: now,
      created_by: actor,
      updated_by: actor,
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('tasks').insert(cloudTaskPayload(task));
        if (error) flagCloudIssue(error, 'saveTask insert');
        else markCloudOk();
      } catch (err) {
        flagCloudIssue(err, 'saveTask insert');
      }
    }

    const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    setLocal(STORAGE_KEYS.TASKS, [...tasks, task]);

    await recalculateProjectProgress(task.project_id);
    if (!opts?.silent) {
      await logActivity(task.project_id, 'task_created', 'task', task.title, {
        entityId: task.id,
        actorName: actor,
      });
    }
    return task;
  }

  // ---- update: gabung dengan data lama ----
  const localTasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  let existing = localTasks.find((t) => t.id === id);
  if (!existing && isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('tasks').select('*').eq('id', id).single();
      if (data) existing = data as Task;
    } catch {
      /* abaikan, pakai fallback di bawah */
    }
  }
  const base: Task = existing ?? {
    id,
    project_id: taskData.project_id!,
    milestone_id: null,
    title: 'New Task',
    status: 'todo',
    priority: 'medium',
    due_date: undefined,
    created_at: now,
  };
  const prevStatus = base.status;

  const task: Task = {
    ...base,
    id,
    project_id: taskData.project_id ?? base.project_id,
    milestone_id: 'milestone_id' in taskData ? taskData.milestone_id || null : base.milestone_id,
    title: taskData.title !== undefined ? taskData.title.trim() || base.title : base.title,
    status: taskData.status ?? base.status,
    priority: taskData.priority ?? base.priority,
    due_date: 'due_date' in taskData ? taskData.due_date : base.due_date,
    created_at: base.created_at || now,
    updated_at: now,
    created_by: base.created_by || actor,
    updated_by: actor,
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('tasks').update(cloudTaskPayload(task)).eq('id', id);
      if (error) flagCloudIssue(error, 'saveTask update');
      else markCloudOk();
    } catch (err) {
      flagCloudIssue(err, 'saveTask update');
    }
  }

  const foundLocally = localTasks.some((t) => t.id === id);
  setLocal(
    STORAGE_KEYS.TASKS,
    foundLocally ? localTasks.map((t) => (t.id === id ? task : t)) : [...localTasks, task]
  );

  await recalculateProjectProgress(task.project_id);
  if (!opts?.silent && prevStatus !== task.status) {
    await logActivity(task.project_id, 'task_status', 'task', task.title, {
      entityId: task.id,
      detail: `${prevStatus} → ${task.status}`,
      actorName: actor,
    });
  }
  return task;
}

export async function deleteTask(id: string, projectId: string): Promise<boolean> {
  requireLoginEmail();
  const actor = getActorName();
  const localTasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  const target = localTasks.find((t) => t.id === id);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      await supabase.from('subtasks').delete().eq('task_id', id);
      await supabase.from('task_comments').delete().eq('task_id', id);
    } catch (err) {
      console.error('Supabase deleteTask exception:', err);
    }
  }

  setLocal(STORAGE_KEYS.TASKS, localTasks.filter((t) => t.id !== id));
  setLocal(
    STORAGE_KEYS.SUBTASKS,
    getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => s.task_id !== id)
  );
  setLocal(
    STORAGE_KEYS.COMMENTS,
    getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => c.task_id !== id)
  );

  await recalculateProjectProgress(projectId);
  if (target) {
    await logActivity(projectId, 'task_deleted', 'task', target.title, {
      entityId: id,
      actorName: actor,
    });
  }
  return true;
}

// ==========================================
// SUBTASKS (checklist dalam tugas)
// ==========================================
export async function saveSubtask(
  data: Partial<Subtask> & { task_id: string; project_id: string }
): Promise<Subtask> {
  requireLoginEmail();
  const now = new Date().toISOString();
  const id = data.id || generateId();
  const isNew = !data.id;
  const list = getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []);
  const existing = list.find((s) => s.id === id);

  const record: Subtask = {
    id,
    project_id: data.project_id,
    task_id: data.task_id,
    title: data.title !== undefined ? data.title.trim() || existing?.title || 'Subtask' : existing?.title || 'Subtask',
    is_done: data.is_done ?? existing?.is_done ?? false,
    position: data.position ?? existing?.position ?? list.filter((s) => s.task_id === data.task_id).length,
    created_at: existing?.created_at || now,
  };

  if (isSupabaseConfigured()) {
    try {
      if (isNew) await supabase.from('subtasks').insert(record);
      else await supabase.from('subtasks').update(record).eq('id', id);
    } catch {
      /* best-effort */
    }
  }

  setLocal(
    STORAGE_KEYS.SUBTASKS,
    existing ? list.map((s) => (s.id === id ? record : s)) : [...list, record]
  );

  if (!isNew && record.is_done && !existing?.is_done) {
    const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    const parent = tasks.find((t) => t.id === record.task_id);
    await logActivity(record.project_id, 'subtask_done', 'subtask', record.title, {
      entityId: record.id,
      detail: parent ? `pada tugas “${parent.title}”` : '',
    });
  }
  return record;
}

export async function deleteSubtask(id: string): Promise<boolean> {
  requireLoginEmail();
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('subtasks').delete().eq('id', id);
    } catch {
      /* best-effort */
    }
  }
  setLocal(
    STORAGE_KEYS.SUBTASKS,
    getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => s.id !== id)
  );
  return true;
}

// ==========================================
// TASK COMMENTS (diskusi per tugas)
// ==========================================
export async function saveComment(
  data: Partial<TaskComment> & { task_id: string; project_id: string }
): Promise<TaskComment> {
  requireLoginEmail();
  const now = new Date().toISOString();
  const content = (data.content || '').trim();
  if (!content) throw new Error('EMPTY_COMMENT');
  const actor = getActorName();
  const record: TaskComment = {
    id: data.id || generateId(),
    project_id: data.project_id,
    task_id: data.task_id,
    author_name: data.author_name?.trim() || actor,
    content,
    created_at: data.created_at || now,
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('task_comments').insert(record);
    } catch {
      /* best-effort */
    }
  }

  setLocal(STORAGE_KEYS.COMMENTS, [...getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []), record]);

  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  const parent = tasks.find((t) => t.id === record.task_id);
  await logActivity(record.project_id, 'comment_added', 'comment', parent?.title || 'Tugas', {
    entityId: record.id,
    detail: content.slice(0, 120),
    actorName: record.author_name,
  });
  return record;
}

export async function deleteComment(id: string): Promise<boolean> {
  requireLoginEmail();
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('task_comments').delete().eq('id', id);
    } catch {
      /* best-effort */
    }
  }
  setLocal(
    STORAGE_KEYS.COMMENTS,
    getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => c.id !== id)
  );
  return true;
}

export async function recalculateProjectProgress(projectId: string): Promise<number> {
  let projectTasks: Task[] = [];

  if (isSupabaseConfigured() && !cloudDegraded) {
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

  if (isNew) {
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
        const { error } = await supabase.from('milestones').insert(milestone);
        if (error) flagCloudIssue(error, 'saveMilestone insert');
        else markCloudOk();
      } catch (err) {
        flagCloudIssue(err, 'saveMilestone insert');
      }
    }

    const milestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
    setLocal(STORAGE_KEYS.MILESTONES, [...milestones, milestone]);
    await logActivity(milestone.project_id, 'milestone_created', 'milestone', milestone.title, {
      entityId: milestone.id,
    });
    return milestone;
  }

  // ---- update parsial: pertahankan judul & due_date lama ----
  const localList = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  let existing = localList.find((m) => m.id === id);
  if (!existing && isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('milestones').select('*').eq('id', id).single();
      if (data) existing = data as Milestone;
    } catch {
      /* abaikan */
    }
  }
  const base: Milestone = existing ?? {
    id,
    project_id: milestoneData.project_id!,
    title: 'New Milestone',
    due_date: undefined,
    is_completed: false,
    created_at: now,
  };

  const milestone: Milestone = {
    ...base,
    id,
    project_id: milestoneData.project_id ?? base.project_id,
    title:
      milestoneData.title !== undefined ? milestoneData.title.trim() || base.title : base.title,
    due_date: 'due_date' in milestoneData ? milestoneData.due_date : base.due_date,
    is_completed: milestoneData.is_completed ?? base.is_completed,
    created_at: base.created_at || now,
  };

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('milestones').update(milestone).eq('id', id);
      if (error) flagCloudIssue(error, 'saveMilestone update');
      else markCloudOk();
    } catch (err) {
      flagCloudIssue(err, 'saveMilestone update');
    }
  }

  const found = localList.some((m) => m.id === id);
  setLocal(
    STORAGE_KEYS.MILESTONES,
    found ? localList.map((m) => (m.id === id ? milestone : m)) : [...localList, milestone]
  );
  if ((existing?.is_completed ?? false) !== milestone.is_completed && milestone.is_completed) {
    await logActivity(milestone.project_id, 'milestone_done', 'milestone', milestone.title, {
      entityId: milestone.id,
    });
  }
  return milestone;
}

export async function deleteMilestone(id: string): Promise<boolean> {
  requireLoginEmail();
  const localList = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  const target = localList.find((m) => m.id === id);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('milestones').delete().eq('id', id);
    } catch (err) {
      console.error('Supabase deleteMilestone exception:', err);
    }
  }

  const milestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  setLocal(STORAGE_KEYS.MILESTONES, milestones.filter((m) => m.id !== id));
  if (target) {
    await logActivity(target.project_id, 'milestone_deleted', 'milestone', target.title, {
      entityId: id,
    });
  }
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

  if (isNew) {
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
        const { data, error } = await supabase.from('logbooks').insert(entry).select().single();
        if (!error && data) {
          markCloudOk();
          await logActivity(entry.project_id, 'logbook_created', 'logbook', entry.title, {
            entityId: entry.id,
            actorName: entry.author_name,
          });
          return data as LogbookEntry;
        }
        if (error) flagCloudIssue(error, 'saveLogbook insert');
      } catch (err) {
        flagCloudIssue(err, 'saveLogbook insert');
      }
    }

    const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
    setLocal(STORAGE_KEYS.LOGBOOKS, [entry, ...logs]);
    await logActivity(entry.project_id, 'logbook_created', 'logbook', entry.title, {
      entityId: entry.id,
      actorName: entry.author_name,
    });
    return entry;
  }

  // ---- update parsial ----
  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  let existing = logs.find((l) => l.id === id);
  if (!existing && isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('logbooks').select('*').eq('id', id).single();
      if (data) existing = data as LogbookEntry;
    } catch {
      /* abaikan */
    }
  }
  const userEmail = logData.user_email ?? existing?.user_email ?? loginEmail;
  const base: LogbookEntry = existing ?? {
    id,
    project_id: logData.project_id!,
    user_email: userEmail,
    title: 'Catatan Perkembangan',
    content_markdown: '',
    log_type: 'daily_update',
    blockers: '',
    author_name: userEmail.split('@')[0] || 'Project Owner',
    tags: [],
    created_at: now,
    updated_at: now,
  };

  const entry: LogbookEntry = {
    ...base,
    id,
    project_id: logData.project_id ?? base.project_id,
    user_email: userEmail,
    title: logData.title !== undefined ? logData.title.trim() || base.title : base.title,
    content_markdown: logData.content_markdown ?? base.content_markdown,
    log_type: logData.log_type ?? base.log_type,
    blockers: logData.blockers !== undefined ? logData.blockers.trim() : base.blockers,
    author_name:
      logData.author_name !== undefined
        ? logData.author_name.trim() || base.author_name
        : base.author_name,
    tags: logData.tags ?? base.tags,
    created_at: base.created_at || now,
    updated_at: now,
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('logbooks')
        .update(entry)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        markCloudOk();
        return data as LogbookEntry;
      }
      if (error) flagCloudIssue(error, 'saveLogbook update');
    } catch (err) {
      flagCloudIssue(err, 'saveLogbook update');
    }
  }

  const found = logs.some((l) => l.id === id);
  setLocal(
    STORAGE_KEYS.LOGBOOKS,
    found ? logs.map((l) => (l.id === id ? entry : l)) : [entry, ...logs]
  );
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
    const localSubtasks = getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []);
    const localComments = getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []);

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
    if (localSubtasks.length > 0) {
      await supabase.from('subtasks').upsert(localSubtasks);
    }
    if (localComments.length > 0) {
      await supabase.from('task_comments').upsert(localComments);
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
        await supabase.from('task_comments').delete().neq('id', '___');
        await supabase.from('subtasks').delete().neq('id', '___');
        await supabase.from('activity_logs').delete().neq('id', '___');
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

      setLocal(
        STORAGE_KEYS.SUBTASKS,
        getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => remainingIds.has(s.project_id))
      );
      setLocal(
        STORAGE_KEYS.COMMENTS,
        getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => remainingIds.has(c.project_id))
      );
      setLocal(
        STORAGE_KEYS.ACTIVITIES,
        getLocal<ActivityLog>(STORAGE_KEYS.ACTIVITIES, []).filter((a) => remainingIds.has(a.project_id))
      );
    } else {
      // Complete wipe
      setLocal(STORAGE_KEYS.PROJECTS, []);
      setLocal(STORAGE_KEYS.MILESTONES, []);
      setLocal(STORAGE_KEYS.TASKS, []);
      setLocal(STORAGE_KEYS.LOGBOOKS, []);
      setLocal(STORAGE_KEYS.SUBTASKS, []);
      setLocal(STORAGE_KEYS.COMMENTS, []);
      setLocal(STORAGE_KEYS.ACTIVITIES, []);
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
  localStorage.setItem(STORAGE_KEYS.SUBTASKS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
}

// ==========================================
// CROSS-PROJECT QUERIES (dashboard views)
// ==========================================

/** All tasks across OWN projects, newest first. Single query — no N+1. */
export async function fetchAllTasks(): Promise<Task[]> {
  const currentEmail = getUserEmail();
  if (!currentEmail) return [];

  if (isSupabaseConfigured() && !cloudDegraded) {
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

  if (isSupabaseConfigured() && !cloudDegraded) {
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

  if (isSupabaseConfigured() && !cloudDegraded) {
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
    const copied = await saveTask(
      {
        project_id: copy.id,
        title: t.title,
        status: 'todo',
        priority: t.priority,
        due_date: t.due_date,
      },
      { silent: true }
    );
    const subs = (detail.subtasks || []).filter((s) => s.task_id === t.id);
    for (const s of subs) {
      await saveSubtask({
        project_id: copy.id,
        task_id: copied.id,
        title: s.title,
        is_done: false,
        position: s.position,
      });
    }
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
  subtasks?: Subtask[];
  comments?: TaskComment[];
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
    subtasks: getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []).filter((s) => ids.has(s.project_id)),
    comments: getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []).filter((c) => ids.has(c.project_id)),
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
    const subtasks = payload.subtasks || [];
    const comments = payload.comments || [];
    setLocal(STORAGE_KEYS.PROJECTS, projects);
    setLocal(STORAGE_KEYS.MILESTONES, payload.milestones || []);
    setLocal(STORAGE_KEYS.TASKS, payload.tasks || []);
    setLocal(STORAGE_KEYS.LOGBOOKS, logbooks);
    setLocal(STORAGE_KEYS.SUBTASKS, subtasks);
    setLocal(STORAGE_KEYS.COMMENTS, comments);

    if (isSupabaseConfigured()) {
      try {
        if (projects.length > 0) await supabase.from('projects').upsert(projects);
        if ((payload.milestones || []).length > 0) await supabase.from('milestones').upsert(payload.milestones);
        if ((payload.tasks || []).length > 0) await supabase.from('tasks').upsert(payload.tasks);
        if (logbooks.length > 0) await supabase.from('logbooks').upsert(logbooks);
        if (subtasks.length > 0) await supabase.from('subtasks').upsert(subtasks);
        if (comments.length > 0) await supabase.from('task_comments').upsert(comments);
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

// ==========================================
// IMPORT PROYEK (GABUNG / MERGE — tidak menghapus data lain)
// Menerima: BackupPayload penuh ATAU satu proyek tunggal:
//   { project, milestones?, tasks?, logbooks? } atau
//   { app:'trackpro-project', project, ... }
// ID bentrok diberi ID baru agar tidak menimpa proyek lain.
// ==========================================

export interface SingleProjectPayload {
  app?: string;
  version?: number;
  project: Project;
  milestones?: Milestone[];
  tasks?: Task[];
  logbooks?: LogbookEntry[];
}

function upsertById<T extends { id: string }>(list: T[], items: T[]): T[] {
  const map = new Map(list.map((x) => [x.id, x]));
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

function remapCollidingIds(
  project: Project,
  milestones: Milestone[],
  tasks: Task[],
  logbooks: LogbookEntry[],
  existingProjectIds: Set<string>,
  existingMilestoneIds: Set<string>,
  existingTaskIds: Set<string>,
  existingLogIds: Set<string>,
  subtasks: Subtask[] = [],
  comments: TaskComment[] = [],
  existingSubtaskIds: Set<string> = new Set(),
  existingCommentIds: Set<string> = new Set()
): {
  project: Project;
  milestones: Milestone[];
  tasks: Task[];
  logbooks: LogbookEntry[];
  subtasks: Subtask[];
  comments: TaskComment[];
} {
  // Jika id proyek sudah dipakai proyek LAIN (judul beda), beri id baru + petakan relasinya.
  let projectId = project.id;
  const projectTakenByOther = existingProjectIds.has(projectId);
  if (projectTakenByOther) {
    projectId = generateId();
  }
  const msIdMap = new Map<string, string>();
  const taskIdMap = new Map<string, string>();
  const idTaken = (set: Set<string>, id: string) => set.has(id);
  const nextMilestones = milestones.map((m) => {
    let newId = m.id;
    if (idTaken(existingMilestoneIds, m.id)) newId = generateId();
    msIdMap.set(m.id, newId);
    return { ...m, id: newId, project_id: projectId };
  });
  const nextTasks = tasks.map((t) => {
    const newId = idTaken(existingTaskIds, t.id) ? generateId() : t.id;
    taskIdMap.set(t.id, newId);
    return {
      ...t,
      id: newId,
      project_id: projectId,
      milestone_id: t.milestone_id ? msIdMap.get(t.milestone_id) || t.milestone_id : null,
    };
  });
  const nextLogs = logbooks.map((l) => ({
    ...l,
    id: idTaken(existingLogIds, l.id) ? generateId() : l.id,
    project_id: projectId,
  }));
  const nextSubtasks = subtasks.map((s) => ({
    ...s,
    id: idTaken(existingSubtaskIds, s.id) ? generateId() : s.id,
    project_id: projectId,
    task_id: taskIdMap.get(s.task_id) || s.task_id,
  }));
  const nextComments = comments.map((c) => ({
    ...c,
    id: idTaken(existingCommentIds, c.id) ? generateId() : c.id,
    project_id: projectId,
    task_id: taskIdMap.get(c.task_id) || c.task_id,
  }));
  return {
    project: { ...project, id: projectId },
    milestones: nextMilestones,
    tasks: nextTasks,
    logbooks: nextLogs,
    subtasks: nextSubtasks,
    comments: nextComments,
  };
}

/** Normalisasi file JSON menjadi daftar proyek + relasinya. */
export function normalizeProjectImport(json: unknown): {
  ok: boolean;
  message: string;
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  logbooks: LogbookEntry[];
  subtasks: Subtask[];
  comments: TaskComment[];
} {
  const fail = (message: string) => ({
    ok: false as const,
    message,
    projects: [] as Project[],
    milestones: [] as Milestone[],
    tasks: [] as Task[],
    logbooks: [] as LogbookEntry[],
    subtasks: [] as Subtask[],
    comments: [] as TaskComment[],
  });
  if (!json || typeof json !== 'object') return fail('File JSON tidak valid.');
  const j = json as Record<string, unknown>;

  // Format 1: backup penuh Tracker Nexus
  if (j.app === 'trackpro' && Array.isArray(j.projects)) {
    return {
      ok: true,
      message: 'Backup penuh terdeteksi.',
      projects: j.projects as Project[],
      milestones: (j.milestones as Milestone[]) || [],
      tasks: (j.tasks as Task[]) || [],
      logbooks: (j.logbooks as LogbookEntry[]) || [],
      subtasks: (j.subtasks as Subtask[]) || [],
      comments: (j.comments as TaskComment[]) || [],
    };
  }
  // Format 2: satu proyek tunggal
  const single = (j.project as Project | undefined) || (j as unknown as Project);
  if (single && typeof single === 'object' && typeof (single as Project).title === 'string') {
    const project = (j.project as Project) || (j as unknown as Project);
    if (!project.id) (project as Project).id = generateId();
    return {
      ok: true,
      message: 'Satu proyek terdeteksi.',
      projects: [project as Project],
      milestones: ((j.milestones as Milestone[]) || []) as Milestone[],
      tasks: ((j.tasks as Task[]) || []) as Task[],
      logbooks: ((j.logbooks as LogbookEntry[]) || []) as LogbookEntry[],
      subtasks: ((j.subtasks as Subtask[]) || []) as Subtask[],
      comments: ((j.comments as TaskComment[]) || []) as TaskComment[],
    };
  }
  return fail('File bukan JSON proyek Tracker Nexus (butuh {project,...} atau backup {projects:[...]}).');
}

/**
 * Impor proyek secara gabung: proyek baru ditambahkan, data lama tetap ada.
 * Aman untuk file contoh MMS di public/samples/.
 */
export async function importProjectsMerge(
  json: unknown
): Promise<{ success: boolean; message: string; importedProjectIds?: string[] }> {
  const loginEmail = requireLoginEmail();
  const norm = normalizeProjectImport(json);
  if (!norm.ok || norm.projects.length === 0) {
    return { success: false, message: norm.message };
  }

  const existingProjects = getLocal<Project>(STORAGE_KEYS.PROJECTS, []);
  const existingMilestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, []);
  const existingTasks = getLocal<Task>(STORAGE_KEYS.TASKS, []);
  const existingLogs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, []);
  const existingSubtasks = getLocal<Subtask>(STORAGE_KEYS.SUBTASKS, []);
  const existingComments = getLocal<TaskComment>(STORAGE_KEYS.COMMENTS, []);

  const projectIds = new Set(existingProjects.map((p) => p.id));
  const milestoneIds = new Set(existingMilestones.map((m) => m.id));
  const taskIds = new Set(existingTasks.map((t) => t.id));
  const logIds = new Set(existingLogs.map((l) => l.id));
  const subtaskIds = new Set(existingSubtasks.map((s) => s.id));
  const commentIds = new Set(existingComments.map((c) => c.id));

  let mergedProjects = [...existingProjects];
  let mergedMilestones = [...existingMilestones];
  let mergedTasks = [...existingTasks];
  let mergedLogs = [...existingLogs];
  let mergedSubtasks = [...existingSubtasks];
  let mergedComments = [...existingComments];
  const importedIds: string[] = [];

  for (const rawProject of norm.projects) {
    const relMs = norm.milestones.filter((m) => m.project_id === rawProject.id);
    const relTasks = norm.tasks.filter((t) => t.project_id === rawProject.id);
    const relLogs = norm.logbooks.filter((l) => l.project_id === rawProject.id);
    const relSubs = (norm.subtasks || []).filter((s) => s.project_id === rawProject.id);
    const relComments = (norm.comments || []).filter((c) => c.project_id === rawProject.id);
    // Proyek tanpa relasi eksplisit (format tunggal campur): sertakan semua jika hanya 1 proyek
    const useAll =
      norm.projects.length === 1 && relMs.length === 0 && relTasks.length === 0 && relLogs.length === 0;
    const remapped = remapCollidingIds(
      rawProject,
      useAll ? norm.milestones : relMs,
      useAll ? norm.tasks : relTasks,
      useAll ? norm.logbooks : relLogs,
      projectIds,
      milestoneIds,
      taskIds,
      logIds,
      useAll ? norm.subtasks || [] : relSubs,
      useAll ? norm.comments || [] : relComments,
      subtaskIds,
      commentIds
    );
    const now = new Date().toISOString();
    const project: Project = {
      ...remapped.project,
      user_email: loginEmail,
      title: remapped.project.title?.trim() || 'Proyek impor',
      created_at: remapped.project.created_at || now,
      updated_at: now,
    };
    const milestones = remapped.milestones;
    const tasks = remapped.tasks;
    const logbooks = remapped.logbooks.map((l) => ({
      ...l,
      user_email: loginEmail,
      created_at: l.created_at || now,
      updated_at: now,
    }));

    mergedProjects = upsertById(mergedProjects, [project]);
    mergedMilestones = upsertById(mergedMilestones, milestones);
    mergedTasks = upsertById(mergedTasks, tasks);
    mergedLogs = upsertById(mergedLogs, logbooks);
    mergedSubtasks = upsertById(mergedSubtasks, remapped.subtasks);
    mergedComments = upsertById(mergedComments, remapped.comments);

    projectIds.add(project.id);
    milestones.forEach((m) => milestoneIds.add(m.id));
    tasks.forEach((t) => taskIds.add(t.id));
    logbooks.forEach((l) => logIds.add(l.id));
    remapped.subtasks.forEach((s) => subtaskIds.add(s.id));
    remapped.comments.forEach((c) => commentIds.add(c.id));
    importedIds.push(project.id);
  }

  setLocal(STORAGE_KEYS.PROJECTS, mergedProjects);
  setLocal(STORAGE_KEYS.MILESTONES, mergedMilestones);
  setLocal(STORAGE_KEYS.TASKS, mergedTasks);
  setLocal(STORAGE_KEYS.LOGBOOKS, mergedLogs);
  setLocal(STORAGE_KEYS.SUBTASKS, mergedSubtasks);
  setLocal(STORAGE_KEYS.COMMENTS, mergedComments);

  // Sinkron cloud (best-effort, hanya data impor milik akun ini)
  if (isSupabaseConfigured()) {
    try {
      const justProjects = mergedProjects.filter((p) => importedIds.includes(p.id));
      const justMs = mergedMilestones.filter((m) => importedIds.includes(m.project_id));
      const justTasks = mergedTasks.filter((t) => importedIds.includes(t.project_id));
      const justLogs = mergedLogs.filter((l) => importedIds.includes(l.project_id));
      const justSubs = mergedSubtasks.filter((s) => importedIds.includes(s.project_id));
      const justComments = mergedComments.filter((c) => importedIds.includes(c.project_id));
      if (justProjects.length > 0) await supabase.from('projects').upsert(justProjects);
      if (justMs.length > 0) await supabase.from('milestones').upsert(justMs);
      if (justTasks.length > 0) await supabase.from('tasks').upsert(justTasks);
      if (justLogs.length > 0) await supabase.from('logbooks').upsert(justLogs);
      if (justSubs.length > 0) await supabase.from('subtasks').upsert(justSubs);
      if (justComments.length > 0) await supabase.from('task_comments').upsert(justComments);
    } catch (err) {
      console.warn('importProjectsMerge cloud sync notice:', err);
    }
  }

  // Progress proyek impor dihitung ulang dari tugasnya
  for (const pid of importedIds) {
    try {
      await recalculateProjectProgress(pid);
    } catch {
      /* abaikan */
    }
  }

  const n = importedIds.length;
  return {
    success: true,
    message:
      n === 1
        ? `Proyek diimpor: ${norm.projects[0]?.title || 'tanpa judul'} (${norm.tasks.length} tugas, ${norm.milestones.length} milestone).`
        : `${n} proyek diimpor (${norm.tasks.length} tugas, ${norm.milestones.length} milestone).`,
    importedProjectIds: importedIds,
  };
}

