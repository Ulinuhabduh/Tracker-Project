export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress_percent: number;
  start_date: string;
  due_date: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  project_id: string;
  milestone_id?: string | null;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  created_at: string;
}

export type LogbookType = 'daily_update' | 'milestone' | 'blocker' | 'release' | 'general';

export interface LogbookEntry {
  id: string;
  project_id: string;
  title: string;
  content_markdown: string;
  log_type: LogbookType;
  blockers?: string;
  author_name?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDetailData extends Project {
  milestones: Milestone[];
  tasks: Task[];
  logbooks: LogbookEntry[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
