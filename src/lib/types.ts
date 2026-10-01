export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Project {
  id: string;
  user_email?: string;
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
  updated_by?: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
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
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Subtask {
  id: string;
  project_id: string;
  task_id: string;
  title: string;
  is_done: boolean;
  position: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  project_id: string;
  task_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export type ActivityAction =
  | 'task_created'
  | 'task_status'
  | 'task_deleted'
  | 'bulk_update'
  | 'subtask_done'
  | 'comment_added'
  | 'milestone_created'
  | 'milestone_done'
  | 'milestone_deleted'
  | 'logbook_created'
  | 'project_status';

export interface ActivityLog {
  id: string;
  project_id: string;
  actor_name: string;
  action: ActivityAction;
  entity_type: 'task' | 'milestone' | 'logbook' | 'project' | 'subtask' | 'comment';
  entity_id?: string;
  entity_title: string;
  detail?: string;
  created_at: string;
}

export type LogbookType = 'daily_update' | 'milestone' | 'blocker' | 'release' | 'general';

export interface LogbookEntry {
  id: string;
  project_id: string;
  user_email?: string;
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
  subtasks: Subtask[];
  comments: TaskComment[];
  activities: ActivityLog[];
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
}
