import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon')
);

// Directly create the Supabase client
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!isConfigured) {
    return {
      success: false,
      message: 'Kredensial Supabase (NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY) belum diisi di .env.local.',
    };
  }

  try {
    const { data, error } = await supabase.from('projects').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Terkoneksi ke Supabase, namun tabel "projects" belum ada. Silakan jalankan script supabase/schema.sql di SQL Editor Supabase.',
        };
      }
      return {
        success: false,
        message: `Error dari Supabase: ${error.message} (Code: ${error.code})`,
      };
    }
    return {
      success: true,
      message: 'Koneksi ke database Supabase PostgreSQL berhasil terhubung sempurna!',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Gagal menghubungi Supabase: ${message}`,
    };
  }
}
