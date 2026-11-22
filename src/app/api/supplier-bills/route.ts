import { json, readBody, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listSupplierBillRecords, createSupplierBillRecord } from '@/modules/supplier-bills';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({
      status: z.enum(['unpaid', 'partially_paid', 'paid', 'overdue']).optional(),
      supplier_id: z.string().optional(),
      due_within_days: z.coerce.number().int().optional(),
      page: z.coerce.number().int().optional(),
    }),
  );
  return json({ supplierBills: await listSupplierBillRecords(s.shopId, q) });
});

export const POST = scoped(async (req, s) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ supplierBill: await createSupplierBillRecord(s, body) }, 201);
});
