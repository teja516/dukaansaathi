import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { computeForecast, parsePeriod } from '@/modules/cash-forecast';

export const GET = scoped(async (req, s) => {
  const q = readQuery(req, z.object({ period: z.enum(['30', '60', '90']).optional() }));
  return json(await computeForecast(s.shopId, parsePeriod(q.period)));
});
