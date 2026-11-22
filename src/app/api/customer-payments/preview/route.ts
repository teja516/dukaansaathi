import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { previewCustomerPaymentRecord } from '@/modules/customer-payments';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({ customer_id: z.string().optional(), credit_transaction_id: z.string().optional(), amount_paise: z.coerce.number().int().optional() }),
  );
  return json(await previewCustomerPaymentRecord(s.shopId, q));
});
