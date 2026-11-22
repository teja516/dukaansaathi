import { json, readBody, open, rateLimit } from '@/lib/http';
import { z } from 'zod';
import { requestPasswordReset } from '@/modules/identity';

export const POST = open(async (req) => {
  rateLimit(req, 'auth', 30, 60_000);
  const body = await readBody(req, z.object({ email: z.string() }));
  return json(await requestPasswordReset(body.email));
});
