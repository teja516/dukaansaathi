import { json, scoped } from '@/lib/http';
import { syncAlertRecords } from '@/modules/alerts';

export const POST = scoped(async (_req, s) => {
  const { created, updated, resolved } = await syncAlertRecords(s.shopId);
  return json({ created, updated, resolved });
});
