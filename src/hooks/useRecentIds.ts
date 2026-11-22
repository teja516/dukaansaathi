'use client';
import { useCallback, useEffect, useState } from 'react';

/** The last few customers/suppliers the owner picked, kept on this device only, for one-tap reuse. */
export function useRecentIds(key: string, max = 4) {
  const storageKey = `dukaan_recent_${key}`;
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      setIds(raw ? (JSON.parse(raw) as string[]).filter((v) => typeof v === 'string') : []);
    } catch {
      setIds([]);
    }
  }, [storageKey]);

  const remember = useCallback(
    (id: string) => {
      try {
        const next = [id, ...ids.filter((v) => v !== id)].slice(0, max);
        window.localStorage.setItem(storageKey, JSON.stringify(next));
        setIds(next);
      } catch {
        /* storage unavailable: shortcuts just will not persist */
      }
    },
    [ids, max, storageKey],
  );

  return { ids, remember };
}
