import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { getCustomerDetailRecord, updateCustomerRecord, deleteCustomerRecord } from '@/modules/customers';

export const GET = scoped(async (_req, s, p) => json(await getCustomerDetailRecord(s.shopId, p.customerId)));

export const PATCH = scoped(async (req, s, p) => {
  const body = await readBody(req, z.object({ name: z.string().optional(), phoneNumber: z.string().nullish(), notes: z.string().nullish() }));
  return json({ customer: await updateCustomerRecord(s, p.customerId, body) });
});

export const DELETE = scoped(async (_req, s, p) => {
  await deleteCustomerRecord(s, p.customerId);
  return new Response(null, { status: 204 });
});
