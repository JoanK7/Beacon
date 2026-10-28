'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { User } from './types';

interface Credentials {
  username: string;
  password: string;
}

interface Registration extends Credentials {
  university: string;
  consent: boolean;
}

interface AuthValue {
  user: User | null;
  loading: boolean;
  login: (credentials: Credentials) => Promise<User>;
  register: (details: Registration) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      api<{ user: User }>('/auth/me')
        .then((data) => setUser(data.user))
        .catch(() => setUser(null))
        .finally(() => setLoading(false)),
    [],
  );

  // Restore the session (if any) from the httpOnly cookie on first load.
  useEffect(() => {
    let cancelled = false;
    api<{ user: User }>('/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    const data = await api<{ user: User }>('/auth/login', { method: 'POST', body: credentials });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (details: Registration) => {
    const data = await api<{ user: User }>('/auth/register', { method: 'POST', body: details });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    // Drop any API responses the service worker cached for offline reading.
    if ('caches' in window) await caches.delete('beacon-api').catch(() => {});
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

/** The signed-in user, for pages inside the (app) group where RequireAuth guarantees one. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('useUser must be used on a signed-in page');
  return user;
}

/** Where each role lands after signing in. */
export function homeFor(user: User | null | undefined): string {
  if (user?.role === 'admin') return '/admin';
  if (user?.role === 'coordinator') return '/coordinator';
  return '/dashboard';
}
