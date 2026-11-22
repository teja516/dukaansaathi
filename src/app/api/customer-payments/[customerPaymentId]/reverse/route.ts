import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import { reverseCustomerPaymentRecord } from '@/modules/customer-payments';

export const POST = scoped(async (req, s, p) => {
  const body = await readBody(req, z.object({ reason: z.string().max(300) }));
  return json({ customerPayment: await reverseCustomerPaymentRecord(s, p.customerPaymentId, body.reason) });
});
