'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

interface ApiState<T> {
  key: string | null;
  data: T | null;
  error: Error | null;
}

/**
 * Load data from a GET endpoint. Returns { data, error, loading, reload }.
 * Previous data is kept while a new request is in flight, so filters can
 * update without the page flashing empty. Pass a null path to skip loading.
 */
export function useApi<T>(path: string | null) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<ApiState<T>>({ key: null, data: null, error: null });
  const key = path ? `${path}#${version}` : null;

  useEffect(() => {
    if (!key || !path) return undefined;
    let cancelled = false;
    api<T>(path).then(
      (data) => {
        if (!cancelled) setResult({ key, data, error: null });
      },
      (error: Error) => {
        if (!cancelled) setResult((prev) => ({ key, data: prev.data, error }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const loading = Boolean(key) && result.key !== key;
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data: result.data, error: loading ? null : result.error, loading, reload };
}
