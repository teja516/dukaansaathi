import { json, readBody, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listCustomerRecords, createCustomerRecord } from '@/modules/customers';

const query = z.object({
  q: z.string().optional(),
  filter: z.enum(['all', 'outstanding', 'overdue']).optional(),
  sort: z.enum(['highest_outstanding', 'oldest_due', 'name']).optional(),
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().optional(),
});

export const GET = scoped(async (req, s) => json(await listCustomerRecords(s.shopId, readQuery(req, query))));

export const POST = scoped(async (req, s) => {
  const body = await readBody(req, z.object({ name: z.string(), phoneNumber: z.string().nullish(), notes: z.string().nullish(), confirmDuplicate: z.boolean().optional() }));
  return json({ customer: await createCustomerRecord(s, body) }, 201);
});
