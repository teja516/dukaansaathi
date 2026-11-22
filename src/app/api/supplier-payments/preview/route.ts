import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { previewSupplierPaymentRecord } from '@/modules/supplier-payments';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({ supplier_id: z.string().optional(), supplier_bill_id: z.string().optional(), amount_paise: z.coerce.number().int().optional() }),
  );
  return json(await previewSupplierPaymentRecord(s.shopId, q));
});
