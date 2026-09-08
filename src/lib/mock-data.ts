import { Project, Milestone, Task, LogbookEntry } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'AI Multi-Agent Analytics Platform',
    description: 'Sistem analitik real-time berbasis AI yang mengotomatisasi pemrosesan data, prediksi tren metrik bisnis, dan integrasi webhook multi-platform.',
    category: 'AI & Fullstack',
    status: 'in_progress',
    priority: 'high',
    progress_percent: 68,
    start_date: '2026-08-15',
    due_date: '2026-09-30',
    tags: ['Next.js', 'Supabase', 'Python', 'LLM', 'Tailwind'],
    created_at: '2026-08-15T08:00:00Z',
    updated_at: '2026-09-08T14:30:00Z'
  },
  {
    id: 'proj-2',
    title: 'Fintech Micro-Lending Portal',
    description: 'Aplikasi portal pengajuan pinjaman UMKM mikro dengan verifikasi KYC otomatis, scoring risiko kredit, dan tanda tangan digital terenkripsi.',
    category: 'Fintech',
    status: 'in_progress',
    priority: 'urgent',
    progress_percent: 45,
    start_date: '2026-08-20',
    due_date: '2026-10-15',
    tags: ['React', 'PostgreSQL', 'KYC', 'Security'],
    created_at: '2026-08-20T10:00:00Z',
    updated_at: '2026-09-07T11:20:00Z'
  },
  {
    id: 'proj-3',
    title: 'Kubernetes Cluster & CI/CD Pipeline',
    description: 'Modernisasi infrastruktur cloud ke k8s private cluster dengan GitOps ArgoCD, monitoring Prometheus & Grafana, serta zero-downtime deployment.',
    category: 'DevOps & Cloud',
    status: 'completed',
    priority: 'medium',
    progress_percent: 100,
    start_date: '2026-07-01',
    due_date: '2026-08-30',
    tags: ['Docker', 'Kubernetes', 'ArgoCD', 'Grafana'],
    created_at: '2026-07-01T09:00:00Z',
    updated_at: '2026-08-30T17:00:00Z'
  },
  {
    id: 'proj-4',
    title: 'Healthcare Patient Portal Mobile App',
    description: 'Aplikasi mobile reservasi jadwal dokter, rekam medis digital pasien, dan integrasi telekonsultasi video call terproteksi HIPAA.',
    category: 'Mobile App',
    status: 'planning',
    priority: 'high',
    progress_percent: 15,
    start_date: '2026-09-01',
    due_date: '2026-11-20',
    tags: ['React Native', 'WebRTC', 'FastAPI'],
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-05T16:00:00Z'
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    project_id: 'proj-1',
    title: 'Arsitektur Sistem & Data Ingestion Pipeline',
    due_date: '2026-08-31',
    is_completed: true,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'ms-2',
    project_id: 'proj-1',
    title: 'Engine Agen AI & Integrasi LLM Evaluator',
    due_date: '2026-09-15',
    is_completed: false,
    created_at: '2026-08-15T08:00:00Z'
  },
  {
    id: 'ms-3',
    project_id: 'proj-1',
    title: 'Interactive Frontend Dashboard & Report Export',
    due_date: '2026-09-28',
    is_completed: false,
    created_at: '2026-08-15T08:00:00Z'
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    project_id: 'proj-1',
    milestone_id: 'ms-1',
    title: 'Setup skema database Supabase PostgreSQL & indexing',
    status: 'done',
    priority: 'high',
    due_date: '2026-08-22',
    created_at: '2026-08-15T08:30:00Z'
  },
  {
    id: 'task-2',
    project_id: 'proj-1',
    milestone_id: 'ms-1',
    title: 'Implementasi Webhook Ingestion Service dengan rate limiter',
    status: 'done',
    priority: 'medium',
    due_date: '2026-08-28',
    created_at: '2026-08-15T08:30:00Z'
  },
  {
    id: 'task-3',
    project_id: 'proj-1',
    milestone_id: 'ms-2',
    title: 'Optimasi token context & streaming response AI agent',
    status: 'in_progress',
    priority: 'high',
    due_date: '2026-09-10',
    created_at: '2026-08-15T08:30:00Z'
  },
  {
    id: 'task-4',
    project_id: 'proj-1',
    milestone_id: 'ms-2',
    title: 'Benchmarking latency query vector embeddings pgvector',
    status: 'todo',
    priority: 'medium',
    due_date: '2026-09-14',
    created_at: '2026-08-15T08:30:00Z'
  },
  {
    id: 'task-5',
    project_id: 'proj-1',
    milestone_id: 'ms-3',
    title: 'Live Chart metrik penggunaan token & cost forecasting',
    status: 'todo',
    priority: 'low',
    due_date: '2026-09-22',
    created_at: '2026-08-15T08:30:00Z'
  }
];

export const INITIAL_LOGBOOKS: LogbookEntry[] = [
  {
    id: 'log-1',
    project_id: 'proj-1',
    title: 'Implementasi Streaming Response & Penanganan Latency LLM',
    log_type: 'daily_update',
    content_markdown: `### 🎯 Rangkuman Pencapaian Hari Ini
Hari ini berhasil mengoptimalkan latency koneksi API agen AI dengan mengimplementasikan Server-Sent Events (SSE) untuk streaming response token secara real-time.

#### ✅ Item yang Diselesaikan:
- [x] Konfigurasi Edge Runtime pada Next.js route handler
- [x] Parsing chunk format stream ke markdown renderer frontend
- [x] Penambahan fallback abort controller jika user menutup tab

#### 📊 Performa Metrik:
| Parameter | Sebelum | Sesudah | Peningkatan |
| :--- | :--- | :--- | :--- |
| First Token Latency | 2.4s | 420ms | **~82% lebih cepat** |
| Memory Footprint | 180MB | 65MB | **Hemat 64%** |

> [!TIP]
> Menggunakan buffer size 64-byte untuk SSE streaming memberikan trade-off terbaik antara kelancaran animasi typing dan throughput HTTP.

\`\`\`typescript
export async function POST(req: Request) {
  const { prompt } = await req.json();
  const stream = await llmClient.stream({ prompt });
  return new Response(stream.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
\`\`\`
`,
    blockers: '',
    author_name: 'Lead Engineer',
    tags: ['AI', 'Performance', 'Streaming'],
    created_at: '2026-09-08T10:15:00Z',
    updated_at: '2026-09-08T10:15:00Z'
  },
  {
    id: 'log-2',
    project_id: 'proj-1',
    title: 'Isu Rate Limiting API Provider & Mitigasi Caching',
    log_type: 'blocker',
    content_markdown: `### ⚠️ Kendala Rate Limiting
Saat pengujian stress testing dengan 50 concurrent requests, kami mengalami \`HTTP 429 Too Many Requests\` dari upstream embedding API.

#### 🛑 Dampak Masalah:
- Proses komputasi similarity vector terhenti sementara.
- Antrean background worker mengalami penumpukan hingga 120 jobs.

#### 🛠️ Rencana Aksi Solusi:
1. Menambahkan **Redis LRU Cache** dengan TTL 24 jam untuk query embeddings yang berulang.
2. Implementasi Exponential Backoff dengan Jitter pada Supabase Edge Functions.

> [!IMPORTANT]
> Jangan merge PR #42 sebelum implementasi retry logic di-test dengan unit test mock 429 status code.
`,
    blockers: 'Rate limit 429 pada upstream embeddings API saat spike traffic',
    author_name: 'Lead Engineer',
    tags: ['Blocker', 'Caching', 'Redis'],
    created_at: '2026-09-06T14:40:00Z',
    updated_at: '2026-09-06T15:00:00Z'
  }
];
