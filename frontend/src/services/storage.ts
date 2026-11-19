import { UserSession } from '../types';

const TOKEN_KEY = 'verlet_cine_auth';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

export const storage = {
  getSession(): UserSession | null {
    // 1. Try localStorage first
    try {
      const data = localStorage.getItem(TOKEN_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed?.accessToken) {
          // Re-sync cookie to keep it persistent across restarts
          setCookie(TOKEN_KEY, data, 365);
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    // 2. Fallback to persistent cookie (vital for TV Silk/webOS/iOS PWA partition resilience)
    try {
      const cookieData = getCookie(TOKEN_KEY);
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        if (parsed?.accessToken) {
          // Re-populate localStorage
          try {
            localStorage.setItem(TOKEN_KEY, cookieData);
          } catch {}
          return parsed;
        }
      }
    } catch {
      // ignore
    }

    return null;
  },

  setSession(session: UserSession): void {
    const serialized = JSON.stringify(session);
    try {
      localStorage.setItem(TOKEN_KEY, serialized);
    } catch (e) {
      console.error('Error saving session to localStorage', e);
    }
    try {
      setCookie(TOKEN_KEY, serialized, 365); // 1 full year persistence
    } catch (e) {
      console.error('Error saving session cookie', e);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Error clearing session', e);
    }
    try {
      deleteCookie(TOKEN_KEY);
    } catch (e) {
      console.error('Error clearing cookie', e);
    }
  }
};

