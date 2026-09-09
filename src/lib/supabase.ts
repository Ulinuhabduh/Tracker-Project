import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseAnonKey.includes('your-anon')
);

// Supabase client with active session persistence and url hash detection
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function isSupabaseConfigured(): boolean {
  return isConfigured;
}

/**
 * URL tujuan setelah klik link konfirmasi email.
 * Prioritas: NEXT_PUBLIC_SITE_URL (wajib diisi saat production),
 * fallback ke origin browser saat development lokal.
 */
export function getEmailRedirectUrl(): string | undefined {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (site && /^https?:\/\//.test(site)) return site;
  if (typeof window !== 'undefined') return window.location.origin;
  return undefined;
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

// ==============================================================================
// 🔐 SECURE EMAIL & PASSWORD AUTHENTICATION WITH MANDATORY CONFIRMATION
// ==============================================================================

/**
 * Register via Email & Password with email confirmation requirement
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; needsConfirmation: boolean; error: Error | null }> {
  if (!isConfigured) {
    return { user: null, session: null, needsConfirmation: false, error: new Error('Supabase belum dikonfigurasi di .env.local') };
  }

  const cleanEmail = email.trim().toLowerCase();
  const redirectTo = getEmailRedirectUrl();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return { user: null, session: null, needsConfirmation: false, error };
  }

  // If Supabase has email confirmations enabled (default), session will be null or email_confirmed_at is null
  const needsConfirmation = !data.session || (data.user && !data.user.email_confirmed_at);

  return {
    user: data.user,
    session: data.session,
    needsConfirmation: Boolean(needsConfirmation),
    error: null,
  };
}

/**
 * Login via Email & Password (requires confirmed email)
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<{ user: User | null; session: Session | null; isNotConfirmed: boolean; error: Error | null }> {
  if (!isConfigured) {
    return { user: null, session: null, isNotConfirmed: false, error: new Error('Supabase belum dikonfigurasi di .env.local') };
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    const isNotConfirmed = error.message.toLowerCase().includes('email not confirmed');
    return { user: null, session: null, isNotConfirmed, error };
  }

  return {
    user: data.user,
    session: data.session,
    isNotConfirmed: false,
    error: null,
  };
}

/**
 * Sign out current user
 */
export async function signOutAuth(): Promise<{ error: Error | null }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current authenticated user
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}
