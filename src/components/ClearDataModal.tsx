'use client';

import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';
import { deleteAllData } from '@/lib/project-service';
import { getUserEmail } from '@/lib/user-session';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCleared: (message: string) => void;
}

export function ClearDataModal({
  isOpen,
  onClose,
  onDataCleared,
}: ClearDataModalProps) {
  const [confirmText, setConfirmText] = React.useState('');
  const [scope, setScope] = React.useState<'all' | 'user_only'>('all');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [userEmail, setUserEmailState] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      const email = getUserEmail();
      setUserEmailState(email);
      if (email) {
        setScope('user_only');
      } else {
        setScope('all');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim().toUpperCase() === 'HAPUS';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    try {
      const res = await deleteAllData(scope);
      onDataCleared(res.message);
      onClose();
    } catch (err) {
      console.error('Error clearing data:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/30 bg-zinc-900 shadow-2xl p-4 sm:p-7 z-10 animate-fade-in my-auto sm:my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Hapus Seluruh Data Proyek
              </h2>
              <p className="text-xs text-rose-400 font-medium mt-0.5">
                Danger Zone: Tindakan ini permanen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Warning Banner */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/25 text-xs text-rose-200 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300 block mb-1">
                Perhatian: Semua data akan dihapus total!
              </span>
              Tindakan ini akan menghapus semua proyek, tugas (checklist), milestone, serta riwayat catatan logbook Anda, baik dari database <strong>Supabase</strong> maupun penyimpanan lokal di perangkat ini. Data yang telah dihapus tidak dapat dikembalikan.
            </div>
          </div>

          {/* Scope selection if user has email */}
          {userEmail && (
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Pilih Cakupan Penghapusan:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-zinc-700 text-xs">
                  <input
                    type="radio"
                    name="scope"
                    value="user_only"
                    checked={scope === 'user_only'}
                    onChange={() => setScope('user_only')}
                    className="accent-rose-500"
                  />
                  <div>
                    <span className="text-zinc-200 font-semibold block">
                      Hanya Data Milik Akun Saya
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      ({userEmail})
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-xl border border-zinc-800 bg-zinc-950 cursor-pointer hover:border-zinc-700 text-xs">
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="accent-rose-500"
                  />
                  <div>
                    <span className="text-zinc-200 font-semibold block">
                      Hapus Seluruh Database (Wipe Total)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Menghapus semua data tanpa terkecuali
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Type HAPUS confirmation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Untuk mengonfirmasi, ketik <span className="font-mono text-rose-400 font-bold">HAPUS</span> di bawah ini:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Ketik HAPUS"
              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-500/40 bg-zinc-950 text-rose-200 font-mono text-sm placeholder-zinc-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!isConfirmed || isDeleting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Trash2 className="h-4 w-4" />
              <span>{isDeleting ? 'Menghapus...' : 'Hapus Semua Data Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
