import { json, readBody, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listExpenseRecords, createExpenseRecord } from '@/modules/expenses';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({
      category: z.enum(['rent', 'electricity', 'wages', 'transport', 'other']).optional(),
      status: z.enum(['unpaid', 'paid', 'cancelled']).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      page: z.coerce.number().int().optional(),
    }),
  );
  return json({ expenses: await listExpenseRecords(s.shopId, q) });
});

export const POST = scoped(async (req, s) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ expense: await createExpenseRecord(s, body) }, 201);
});
