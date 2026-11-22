import { json, readBody, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listCustomerPaymentRecords, createCustomerPaymentRecord } from '@/modules/customer-payments';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({ customer_id: z.string().optional(), credit_transaction_id: z.string().optional(), page: z.coerce.number().int().optional() }),
  );
  return json({ customerPayments: await listCustomerPaymentRecords(s.shopId, q) });
});

export const POST = scoped(async (req, s) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ customerPayment: await createCustomerPaymentRecord(s, body) }, 201);
});
