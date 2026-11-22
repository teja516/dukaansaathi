import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { runWhatIfScenario } from '@/modules/what-if-scenario';

export const GET = scoped(async (req, s) => {
  const q = readQuery(req, z.object({ credit_transaction_id: z.string().optional(), delay_days: z.coerce.number().int().optional() }));
  return json(await runWhatIfScenario(s.shopId, q));
});
