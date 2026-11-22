import { json, readBody, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listCreditTransactionRecords, createCreditTransactionRecord } from '@/modules/credit-transactions';

const query = z.object({
  customer_id: z.string().optional(),
  status: z.enum(['unpaid', 'partially_paid', 'paid']).optional(),
  expected: z.enum(['any', 'overdue', 'none']).optional(),
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
});

export const GET = scoped(async (req, s) => json(await listCreditTransactionRecords(s.shopId, readQuery(req, query))));

export const POST = scoped(async (req, s) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ creditTransaction: await createCreditTransactionRecord(s, body) }, 201);
});
