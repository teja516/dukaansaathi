import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { markExpensePaid } from '@/modules/expenses';

export const POST = scoped(async (req, s, p) => {
  const body = await readBody(req, z.object({ payment_date: z.string().optional(), payment_method: z.string().optional() }));
  return json({ expense: await markExpensePaid(s, p.expenseId, body) });
});
