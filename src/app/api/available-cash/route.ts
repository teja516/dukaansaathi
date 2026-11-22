import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { getAvailableCashSnapshot } from '@/modules/available-cash';

export const GET = scoped(async (req, s) => {
  const q = readQuery(req, z.object({ limit: z.coerce.number().int().optional() }));
  return json(await getAvailableCashSnapshot(s.shopId, q.limit));
});
