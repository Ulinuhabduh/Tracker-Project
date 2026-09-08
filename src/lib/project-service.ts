import { supabase, isSupabaseConfigured } from './supabase';
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

// ==========================================
// PROJECTS
// ==========================================
export async function fetchProjects(): Promise<Project[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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

  // Fallback when .env.local not configured yet
  return getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
}

export async function fetchProjectDetail(id: string): Promise<ProjectDetailData | null> {
  if (isSupabaseConfigured()) {
    try {
      const [projRes, msRes, taskRes, logRes] = await Promise.all([
        supabase.from('projects').select('*').eq('id', id).single(),
        supabase.from('milestones').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        supabase.from('logbooks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      ]);

      if (!projRes.error && projRes.data) {
        return {
          ...(projRes.data as Project),
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
  const isNew = !projectData.id;
  const now = new Date().toISOString();
  const id = projectData.id || generateId();

  const projectRecord: Project = {
    id,
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

  // Recalculate progress for project
  await recalculateProjectProgress(task.project_id);

  return task;
}

export async function deleteTask(id: string, projectId: string): Promise<boolean> {
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
// LOGBOOKS (WITH LIVE PREVIEW)
// ==========================================
export async function saveLogbook(logData: Partial<LogbookEntry>): Promise<LogbookEntry> {
  const isNew = !logData.id;
  const now = new Date().toISOString();
  const id = logData.id || generateId();

  const entry: LogbookEntry = {
    id,
    project_id: logData.project_id!,
    title: logData.title?.trim() || 'Catatan Perkembangan',
    content_markdown: logData.content_markdown || '',
    log_type: logData.log_type || 'daily_update',
    blockers: logData.blockers?.trim() || '',
    author_name: logData.author_name?.trim() || 'Project Owner',
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

export function resetToInitialSeed(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(INITIAL_MILESTONES));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(STORAGE_KEYS.LOGBOOKS, JSON.stringify(INITIAL_LOGBOOKS));
}
