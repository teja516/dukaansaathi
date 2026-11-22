import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listCashMovementRecords } from '@/modules/cash-movements';

export const GET = scoped(async (req, s) => {
  const q = readQuery(
    req,
    z.object({
      direction: z.enum(['inflow', 'outflow']).optional(),
      payment_method: z.enum(['cash', 'upi', 'bank']).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
      limit: z.coerce.number().int().optional(),
      cursor: z.string().optional(),
    }),
  );
  return json(await listCashMovementRecords(s.shopId, q));
});
