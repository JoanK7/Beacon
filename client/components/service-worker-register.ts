'use client';

import { useEffect } from 'react';

/** Registers public/sw.js in production builds only (avoids stale caches while developing). */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Offline support is progressive enhancement; the app works without it.
    });
  }, []);
  return null;
}
