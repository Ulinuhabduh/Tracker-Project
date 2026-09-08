# 🚀 NexusTrack Pro — Project Progress & Live Logbook Tracker

Web app modern berstandar **UI/UX Max Pro** untuk melacak progres multi-project, pencapaian milestone, task checklist otomatis, serta jurnal perkembangan (**Logbook**) dengan fitur **Live Preview Markdown Editor**.

---

## 🌟 Fitur Utama

### 1. 📝 Logbook Terintegrasi dengan Live Markdown Preview
- **Dual-Pane Realtime Editor**: Panel kiri untuk menulis Markdown, panel kanan otomatis menampilkan render visual secara langsung tanpa jeda (*zero-latency live preview*).
- **View Modes**: Split View (Side-by-side), Editor Only, atau Preview Only.
- **Smart Formatting Toolbar**: Akses cepat ke format **Bold**, *Italic*, Heading 3, Task Checklist (`- [ ]`), Code block syntax, Tabel, GitHub Callout Alerts (`> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`), dan Timestamp otomatis.
- **Preset Templates**: Template bawaan untuk Daily Standup, Blocker Incident, dan Shipment/Release.
- **Live Metrics**: Menghitung jumlah kata, karakter, dan estimasi waktu baca secara real-time.

### 2. 📊 Portfolio & KPI Metrics Dashboard
- **Metrik Utama**: Total Proyek, Sedang Berjalan, Rata-rata Progres Keseluruhan, dan Proyek yang Melebihi Tenggat (*Overdue Alerts*).
- **Filtering & Instant Search**: Filter berdasarkan status (Planning, In Progress, On Hold, Completed), kategori, prioritas, dan pencarian cepat.
- **Project Card Interaktif**: Indikator persentase dinamis, hitung mundur deadline, tag teknologi, dan opsi ganti status langsung dari dropdown.

### 3. ✅ Tasks & Milestones dengan Kalkulasi Progres Otomatis
- **Interactive Checklists**: Klik untuk mengubah alur tugas (`To Do` ➔ `In Progress` ➔ `Done`).
- **Auto-Calculate Progress**: Persentase progres proyek otomatis diperbarui berdasarkan rasio task yang diselesaikan.
- **Celebration Effect**: Efek confetti otomatis terpicu saat seluruh task terselesaikan 100%!
- **Milestone Phasing**: Kelompokkan tugas ke dalam titik capaian penting proyek.

### 4. 🗄️ Database Supabase & Local Fallback Resilience
- Menggunakan database **Supabase (PostgreSQL)** dengan file skema DDL lengkap di [`supabase/schema.sql`](supabase/schema.sql).
- **Hybrid Persistence**: Jika kredensial Supabase belum diisi, aplikasi tetap dapat dijalankan secara instan dan interaktif menggunakan **LocalStorage** dengan data sample realistis. Begitu Supabase dikonfigurasi, data dapat terhubung langsung ke PostgreSQL.

---

## 🛠️ Panduan Memulai

### 1. Menjalankan Server Pengembangan

```bash
npm run dev
```

Buka peramban Anda di [http://localhost:3000](http://localhost:3000).

### 2. Menghubungkan ke Supabase (Opsional tapi Direkomendasikan)

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Buka menu **SQL Editor**, lalu salin dan jalankan seluruh isi file [`supabase/schema.sql`](supabase/schema.sql).
3. Di dalam aplikasi, klik tombol **Supabase (Local Mode)** di pojok kanan atas navbar, atau buat file `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   ```
4. Klik **Uji Koneksi Supabase** dan **Simpan Kredensial**.

---

## 🎨 Standar UI/UX Max Pro
- **Palette**: Obsidian & Zinc-950 dark mode, micro-borders (`border-zinc-800`), glassmorphism cards.
- **Aksen Terarah**: Emerald (completed/healthy), Sky/Indigo (active/in-progress), Amber (warning/medium), Rose (blockers/urgent).
- **Tipografi**: Geist Sans & Geist Mono dengan layout terstruktur dan bebas dari estetika generic "AI slop".
