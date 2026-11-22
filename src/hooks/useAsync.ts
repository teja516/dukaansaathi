'use client';
import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react';
import { ApiError } from '@/lib/api';
import { errorMessage } from '@/lib/utils';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  unauthorized: boolean;
  reload: () => void;
}

/** Runs an async loader on mount and whenever deps change. Ignores results from stale runs. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const run = useRef(0);

  useEffect(() => {
    const id = ++run.current;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (id !== run.current) return;
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        if (id !== run.current) return;
        setUnauthorized(err instanceof ApiError && err.status === 401);
        setError(errorMessage(err));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { data, error, loading, unauthorized, reload };
}
