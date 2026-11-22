import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { parsePeriod } from '@/modules/cash-forecast';
import { getCashSurvivalRadarSnapshot } from '@/modules/cash-survival-radar';

export const GET = scoped(async (req, s) => {
  const q = readQuery(req, z.object({ period: z.enum(['30', '60', '90']).optional() }));
  return json(await getCashSurvivalRadarSnapshot(s.shopId, parsePeriod(q.period)));
});
