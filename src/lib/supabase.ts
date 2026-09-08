import { createClient, SupabaseClient } from '@supabase/supabase-js';

const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const STORAGE_KEY_URL = 'track_progress_supabase_url';
const STORAGE_KEY_ANON = 'track_progress_supabase_anon';

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedKey = localStorage.getItem(STORAGE_KEY_ANON);
    if (storedUrl && storedKey) {
      return { url: storedUrl, anonKey: storedKey };
    }
  }
  return { url: ENV_URL, anonKey: ENV_KEY };
}

export function saveStoredSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem(STORAGE_KEY_URL, url.trim());
      localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_URL);
      localStorage.removeItem(STORAGE_KEY_ANON);
    }
    clientInstance = null; // reset client instance
  }
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseCredentials();

  if (!url || !anonKey || url === 'your-supabase-url' || anonKey === 'your-supabase-anon-key') {
    return null;
  }

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, anonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    } catch (err) {
      console.error('Failed to create Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getStoredSupabaseCredentials();
  return Boolean(
    url && 
    anonKey && 
    url.startsWith('http') && 
    url !== 'your-supabase-url' && 
    anonKey !== 'your-supabase-anon-key'
  );
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase (URL atau Anon Key) belum dikonfigurasi.',
    };
  }

  try {
    const { data, error } = await client.from('projects').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Terkoneksi ke Supabase, namun tabel "projects" belum dibuat. Harap jalankan script SQL migrasi.',
        };
      }
      return {
        success: false,
        message: `Error koneksi Supabase: ${error.message} (Code: ${error.code})`,
      };
    }
    return {
      success: true,
      message: 'Koneksi ke database Supabase berhasil terhubung!',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menghubungi Supabase: ${message}`,
    };
  }
}
