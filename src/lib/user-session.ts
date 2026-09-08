const STORAGE_KEY_USER_EMAIL = 'track_progress_user_email';

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
