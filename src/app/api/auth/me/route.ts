import { json, readBody, authed } from '@/lib/http';
import { z } from 'zod';
import { getAuthMeResponse, updateAuthMeProfile } from '@/modules/identity';

export const GET = authed(async (_req, session) => json(await getAuthMeResponse(session.userId)));

export const PATCH = authed(async (req, session) => {
  const body = await readBody(req, z.object({ name: z.string().optional(), email: z.string().optional() }));
  return json(await updateAuthMeProfile(session.userId, body));
});
