import { json, readBody, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listSupplierPaymentRecords, createSupplierPaymentRecord } from '@/modules/supplier-payments';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({ supplier_id: z.string().optional(), supplier_bill_id: z.string().optional(), page: z.coerce.number().int().optional() }),
  );
  return json({ supplierPayments: await listSupplierPaymentRecords(s.shopId, q) });
});

export const POST = scoped(async (req, s) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ supplierPayment: await createSupplierPaymentRecord(s, body) }, 201);
});
