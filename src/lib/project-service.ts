import { getSupabaseClient, isSupabaseConfigured } from './supabase';
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

// Helper to access LocalStorage safely
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

// Generate random UUID if crypto.randomUUID is not available
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
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Project[];
      }
      console.warn('Supabase fetchProjects warning:', error?.message);
    } catch (err) {
      console.warn('Falling back to local storage for fetchProjects:', err);
    }
  }

  return getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
}

export async function fetchProjectDetail(id: string): Promise<ProjectDetailData | null> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const [projRes, msRes, taskRes, logRes] = await Promise.all([
        client.from('projects').select('*').eq('id', id).single(),
        client.from('milestones').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        client.from('tasks').select('*').eq('project_id', id).order('created_at', { ascending: true }),
        client.from('logbooks').select('*').eq('project_id', id).order('created_at', { ascending: false }),
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
      console.warn('Falling back to local for fetchProjectDetail:', err);
    }
  }

  // Local fallback
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

  const newProject: Project = {
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

  const client = getSupabaseClient();
  if (client) {
    try {
      if (isNew) {
        const { data, error } = await client.from('projects').insert(newProject).select().single();
        if (!error && data) return data as Project;
      } else {
        const { data, error } = await client
          .from('projects')
          .update(newProject)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as Project;
      }
    } catch (err) {
      console.warn('Supabase saveProject error, writing to local:', err);
    }
  }

  // Local fallback
  const list = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  let updatedList: Project[];
  if (isNew) {
    updatedList = [newProject, ...list];
  } else {
    updatedList = list.map((p) => (p.id === id ? newProject : p));
  }
  setLocal(STORAGE_KEYS.PROJECTS, updatedList);
  return newProject;
}

export async function deleteProject(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('projects').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteProject error:', err);
    }
  }

  const list = getLocal<Project>(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  setLocal(STORAGE_KEYS.PROJECTS, list.filter((p) => p.id !== id));

  // Also cascade clean local milestones, tasks, logbooks
  const ms = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  setLocal(STORAGE_KEYS.MILESTONES, ms.filter((m) => m.project_id !== id));

  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  setLocal(STORAGE_KEYS.TASKS, tasks.filter((t) => t.project_id !== id));

  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  setLocal(STORAGE_KEYS.LOGBOOKS, logs.filter((l) => l.project_id !== id));

  return true;
}

// ==========================================
// TASKS & RECALCULATE PROJECT PROGRESS
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

  const client = getSupabaseClient();
  if (client) {
    try {
      if (isNew) {
        await client.from('tasks').insert(task);
      } else {
        await client.from('tasks').update(task).eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase saveTask error:', err);
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

  // Auto recalculate progress for project
  await recalculateProjectProgress(task.project_id);

  return task;
}

export async function deleteTask(id: string, projectId: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('tasks').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteTask error:', err);
    }
  }

  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  setLocal(STORAGE_KEYS.TASKS, tasks.filter((t) => t.id !== id));

  await recalculateProjectProgress(projectId);
  return true;
}

export async function recalculateProjectProgress(projectId: string): Promise<number> {
  let projectTasks: Task[] = [];
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data } = await client.from('tasks').select('*').eq('project_id', projectId);
      if (data) projectTasks = data as Task[];
    } catch (err) {
      console.warn('recalculateProjectProgress error:', err);
    }
  }

  if (projectTasks.length === 0) {
    const localTasks = getLocal<Task>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    projectTasks = localTasks.filter((t) => t.project_id === projectId);
  }

  if (projectTasks.length === 0) return 0;

  const completed = projectTasks.filter((t) => t.status === 'done').length;
  const progressPercent = Math.round((completed / projectTasks.length) * 100);

  // Update status if completed or started
  let statusUpdate: Project['status'] | undefined;
  if (progressPercent === 100) {
    statusUpdate = 'completed';
  } else if (progressPercent > 0) {
    statusUpdate = 'in_progress';
  }

  if (client) {
    try {
      const payload: Record<string, unknown> = {
        progress_percent: progressPercent,
        updated_at: new Date().toISOString(),
      };
      if (statusUpdate) payload.status = statusUpdate;
      await client.from('projects').update(payload).eq('id', projectId);
    } catch (err) {
      console.warn('Failed updating project progress on Supabase:', err);
    }
  }

  // Update local
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

  const client = getSupabaseClient();
  if (client) {
    try {
      if (isNew) {
        await client.from('milestones').insert(milestone);
      } else {
        await client.from('milestones').update(milestone).eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase saveMilestone error:', err);
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
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('milestones').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteMilestone error:', err);
    }
  }

  const milestones = getLocal<Milestone>(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES);
  setLocal(STORAGE_KEYS.MILESTONES, milestones.filter((m) => m.id !== id));
  return true;
}

// ==========================================
// LOGBOOKS (WITH LIVE PREVIEW SUPPORT)
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

  const client = getSupabaseClient();
  if (client) {
    try {
      if (isNew) {
        const { data, error } = await client.from('logbooks').insert(entry).select().single();
        if (!error && data) return data as LogbookEntry;
      } else {
        const { data, error } = await client
          .from('logbooks')
          .update(entry)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) return data as LogbookEntry;
      }
    } catch (err) {
      console.warn('Supabase saveLogbook error:', err);
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
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('logbooks').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteLogbook error:', err);
    }
  }

  const logs = getLocal<LogbookEntry>(STORAGE_KEYS.LOGBOOKS, INITIAL_LOGBOOKS);
  setLocal(STORAGE_KEYS.LOGBOOKS, logs.filter((l) => l.id !== id));
  return true;
}

// Reset data to initial mock seed (useful for testing)
export function resetToInitialSeed(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(INITIAL_PROJECTS));
  localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify(INITIAL_MILESTONES));
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
  localStorage.setItem(STORAGE_KEYS.LOGBOOKS, JSON.stringify(INITIAL_LOGBOOKS));
}
