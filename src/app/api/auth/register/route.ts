import { json, readBody, open, rateLimit } from '@/lib/http';
import { z } from 'zod';
import { registerUser } from '@/modules/identity';

export const POST = open(async (req) => {
  rateLimit(req, 'auth', 30, 60_000);
  const body = await readBody(req, z.object({ name: z.string(), email: z.string(), password: z.string() }));
  return json(await registerUser(body), 201);
});
