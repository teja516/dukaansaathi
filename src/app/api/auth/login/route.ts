import { json, readBody, open, rateLimit } from '@/lib/http';
import { z } from 'zod';
import { loginUser } from '@/modules/identity';
import { sessionCookie } from '@/lib/authContext';

export const POST = open(async (req) => {
  rateLimit(req, 'auth', 30, 60_000);
  const body = await readBody(req, z.object({ email: z.string(), password: z.string() }));
  const { token, body: payload } = await loginUser(body);
  return json(payload, 200, { 'Set-Cookie': sessionCookie(token) });
});
