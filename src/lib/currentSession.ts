import { cache } from 'react';
import { headers } from 'next/headers';
import { getSession, type Session } from '@/lib/authContext';

/** The signed-in user for this request (server components only). Memoised, so metadata and page share one lookup. */
export const currentSession = cache(async (): Promise<Session | null> => {
  const incoming = await headers();
  return getSession(new Request('http://localhost/', { headers: new Headers(incoming) })).catch(() => null);
});
