import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { getSupplierBillRecord, updateSupplierBillRecord, deleteSupplierBillRecord } from '@/modules/supplier-bills';

export const GET = scoped(async (_req, s, p) => json(await getSupplierBillRecord(s.shopId, p.supplierBillId)));

export const PATCH = scoped(async (req, s, p) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ supplierBill: await updateSupplierBillRecord(s, p.supplierBillId, body) });
});

export const DELETE = scoped(async (_req, s, p) => {
  await deleteSupplierBillRecord(s, p.supplierBillId);
  return new Response(null, { status: 204 });
});
