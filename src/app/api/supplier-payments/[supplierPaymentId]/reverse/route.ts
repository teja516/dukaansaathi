import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { reverseSupplierPaymentRecord } from '@/modules/supplier-payments';

export const POST = scoped(async (req, s, p) => {
  const body = await readBody(req, z.object({ reason: z.string().max(300) }));
  return json({ supplierPayment: await reverseSupplierPaymentRecord(s, p.supplierPaymentId, body.reason) });
});
