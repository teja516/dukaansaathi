// Auth token store — the single source of truth for the JWT the backend issues
// at login. The login page persists the token here (setToken) and the typed API
// client reads it (getToken) to attach `Authorization: Bearer`. On unified-Next
// the login route ALSO sets an httpOnly cookie; this Bearer channel is what keeps
// auth working inside the IDE preview's cross-site iframe.
// Do not change the storage key without updating @/lib/api.
const TOKEN_KEY = 'auth_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore storage errors (private mode / quota) */
  }
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
