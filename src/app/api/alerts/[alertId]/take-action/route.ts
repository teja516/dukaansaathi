import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { takeActionOnAlert } from '@/modules/alerts';

export const POST = scoped(async (req, s, p) => {
  const body = await readBody(req, z.object({ action_note: z.string().optional() }));
  return json({ alert: await takeActionOnAlert(s, p.alertId, body) });
});
