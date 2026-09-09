import {
  LayoutDashboard,
  Sun,
  CalendarClock,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export type ViewKey = 'dashboard' | 'today' | 'deadlines' | 'activity';

export interface NavItem {
  key: ViewKey;
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', hint: 'Ringkasan semua proyek', icon: LayoutDashboard },
  { key: 'today', label: 'Hari ini', hint: 'Tugas jatuh tempo & terlambat', icon: Sun },
  { key: 'deadlines', label: 'Tenggat', hint: 'Linimasa deadline proyek', icon: CalendarClock },
  { key: 'activity', label: 'Aktivitas', hint: 'Logbook terbaru lintas proyek', icon: Activity },
];

export const VIEW_TITLES: Record<ViewKey, { title: string; desc: string }> = {
  dashboard: { title: 'Dashboard', desc: 'Ringkasan portfolio & progres' },
  today: { title: 'Hari ini', desc: 'Fokus: yang jatuh tempo & terlambat' },
  deadlines: { title: 'Tenggat', desc: 'Semua deadline dalam satu linimasa' },
  activity: { title: 'Aktivitas', desc: 'Catatan terbaru dari semua proyek' },
};
