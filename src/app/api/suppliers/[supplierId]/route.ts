import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { getSupplierDetailRecord, updateSupplierRecord, deleteSupplierRecord } from '@/modules/suppliers';

export const GET = scoped(async (_req, s, p) => json(await getSupplierDetailRecord(s.shopId, p.supplierId)));

export const PATCH = scoped(async (req, s, p) => {
  const body = await readBody(req, z.object({ name: z.string().optional(), phoneNumber: z.string().nullish(), notes: z.string().nullish() }));
  return json({ supplier: await updateSupplierRecord(s, p.supplierId, body) });
});

export const DELETE = scoped(async (_req, s, p) => {
  await deleteSupplierRecord(s, p.supplierId);
  return new Response(null, { status: 204 });
});
