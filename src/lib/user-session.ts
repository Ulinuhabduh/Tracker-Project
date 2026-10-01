const STORAGE_KEY_USER_EMAIL = 'track_progress_user_email';
const STORAGE_KEY_DISPLAY_NAME = 'track_progress_display_name';

export function getUserEmail(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY_USER_EMAIL) || '';
  } catch (err) {
    console.error('Failed to read user email from localStorage:', err);
    return '';
  }
}

export function setUserEmail(email: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (email && email.trim()) {
      localStorage.setItem(STORAGE_KEY_USER_EMAIL, email.trim().toLowerCase());
    } else {
      localStorage.removeItem(STORAGE_KEY_USER_EMAIL);
    }
  } catch (err) {
    console.error('Failed to save user email to localStorage:', err);
  }
}

export function clearUserEmail(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_USER_EMAIL);
  } catch (err) {
    console.error('Failed to clear user email from localStorage:', err);
  }
}

/**
 * Nama tampilan per perangkat. Satu akun dipakai bareng, jadi tiap orang
 * mengisi namanya di sini agar komentar & jejak aktivitas jelas penulisnya.
 */
export function getDisplayName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (localStorage.getItem(STORAGE_KEY_DISPLAY_NAME) || '').trim();
  } catch (err) {
    console.error('Failed to read display name from localStorage:', err);
    return '';
  }
}

export function setDisplayName(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    const v = (name || '').trim();
    if (v) localStorage.setItem(STORAGE_KEY_DISPLAY_NAME, v);
    else localStorage.removeItem(STORAGE_KEY_DISPLAY_NAME);
  } catch (err) {
    console.error('Failed to save display name to localStorage:', err);
  }
}

/** Nama penulis untuk audit/komentar: nama tampilan → prefix email → 'Tim'. */
export function getActorName(): string {
  const display = getDisplayName();
  if (display) return display;
  const email = getUserEmail();
  if (email) return email.split('@')[0] || email;
  return 'Tim';
}
