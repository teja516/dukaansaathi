import { json, readBody, open, rateLimit } from '@/lib/http';
import { z } from 'zod';
import { completePasswordReset } from '@/modules/identity';

export const POST = open(async (req) => {
  rateLimit(req, 'auth', 30, 60_000);
  const body = await readBody(req, z.object({ token: z.string(), password: z.string() }));
  await completePasswordReset(body);
  return json({ success: true });
});
