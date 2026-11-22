import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { buildReminderDraft } from '@/modules/customers';

export const GET = scoped(async (req, s, p) => {
  const q = readQuery(req, z.object({ language: z.enum(['english', 'hindi']).optional() }));
  return json(await buildReminderDraft(s.shopId, p.customerId, q.language ?? 'hindi'));
});
