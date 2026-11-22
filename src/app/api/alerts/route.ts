import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listAlertRecords } from '@/modules/alerts';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({
      filter_category: z.enum(['collections', 'supplier', 'expenses', 'cash_risk']).optional(),
      status: z.enum(['new', 'reviewed', 'action_taken', 'resolved']).optional(),
      limit: z.coerce.number().int().optional(),
      cursor: z.string().optional(),
    }),
  );
  return json(await listAlertRecords(s.shopId, q));
});
