-- ==============================================================================
-- 🚀 SUPABASE DATABASE SCHEMA: PROJECT PROGRESS TRACKER
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/_/sql

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE: PROJECTS
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'on_hold', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLE: MILESTONES
CREATE TABLE IF NOT EXISTS public.milestones (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE: TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id TEXT REFERENCES public.milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLE: LOGBOOKS
CREATE TABLE IF NOT EXISTS public.logbooks (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_markdown TEXT NOT NULL,
    log_type TEXT NOT NULL DEFAULT 'daily_update' CHECK (log_type IN ('daily_update', 'milestone', 'blocker', 'release', 'general')),
    blockers TEXT DEFAULT '',
    author_name TEXT DEFAULT 'Admin',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_milestones_project_id ON public.milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_logbooks_project_id ON public.logbooks(project_id);
CREATE INDEX IF NOT EXISTS idx_logbooks_created_at ON public.logbooks(created_at DESC);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbooks ENABLE ROW LEVEL SECURITY;

-- 8. OPEN ACCESS POLICIES (Cocok untuk prototyping / solo use)
CREATE POLICY "Allow public all access on projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on milestones" ON public.milestones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on logbooks" ON public.logbooks FOR ALL USING (true) WITH CHECK (true);

-- 9. INITIAL SAMPLE DATA (OPSIONAL)
INSERT INTO public.projects (id, title, description, category, status, priority, progress_percent, start_date, due_date, tags)
VALUES 
(
    'proj-1', 
    'AI Multi-Agent Analytics Platform', 
    'Sistem analitik real-time berbasis AI yang mengotomatisasi pemrosesan data, prediksi tren metrik bisnis, dan integrasi webhook multi-platform.',
    'AI & Fullstack',
    'in_progress',
    'high',
    68,
    '2026-08-15',
    '2026-09-30',
    ARRAY['Next.js', 'Supabase', 'Python', 'LLM', 'Tailwind']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.milestones (id, project_id, title, due_date, is_completed)
VALUES 
('ms-1', 'proj-1', 'Arsitektur Sistem & Data Ingestion Pipeline', '2026-08-31', true),
('ms-2', 'proj-1', 'Engine Agen AI & Integrasi LLM Evaluator', '2026-09-15', false),
('ms-3', 'proj-1', 'Interactive Frontend Dashboard & Report Export', '2026-09-28', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tasks (id, project_id, milestone_id, title, status, priority, due_date)
VALUES 
('task-1', 'proj-1', 'ms-1', 'Setup skema database Supabase PostgreSQL & indexing', 'done', 'high', '2026-08-22'),
('task-2', 'proj-1', 'ms-1', 'Implementasi Webhook Ingestion Service dengan rate limiter', 'done', 'medium', '2026-08-28'),
('task-3', 'proj-1', 'ms-2', 'Optimasi token context & streaming response AI agent', 'in_progress', 'high', '2026-09-10'),
('task-4', 'proj-1', 'ms-2', 'Benchmarking latency query vector embeddings pgvector', 'todo', 'medium', '2026-09-14'),
('task-5', 'proj-1', 'ms-3', 'Live Chart metrik penggunaan token & cost forecasting', 'todo', 'low', '2026-09-22')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.logbooks (id, project_id, title, content_markdown, log_type, blockers, author_name, tags)
VALUES 
(
    'log-1', 
    'proj-1', 
    'Implementasi Streaming Response & Penanganan Latency LLM', 
    '### 🎯 Rangkuman Pencapaian Hari Ini\nHari ini berhasil mengoptimalkan latency koneksi API agen AI dengan mengimplementasikan Server-Sent Events (SSE).\n\n#### ✅ Item Selesai:\n- [x] Edge Runtime route handler\n- [x] Stream parser chunking\n- [x] AbortController graceful fallback\n\n> [!TIP]\n> Chunk buffering 64-byte memberikan visual typing fluid tanpa jank.',
    'daily_update',
    '',
    'Lead Engineer',
    ARRAY['AI', 'Performance', 'Streaming']
)
ON CONFLICT (id) DO NOTHING;
