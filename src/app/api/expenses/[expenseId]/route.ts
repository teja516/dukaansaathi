import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { getExpenseRecord, updateExpenseRecord } from '@/modules/expenses';

export const GET = scoped(async (_req, s, p) => json({ expense: await getExpenseRecord(s.shopId, p.expenseId) }));

export const PATCH = scoped(async (req, s, p) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ expense: await updateExpenseRecord(s, p.expenseId, body) });
});
