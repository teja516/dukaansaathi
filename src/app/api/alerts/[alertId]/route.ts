import { json, scoped } from '@/lib/http';
import { getAlertRecord } from '@/modules/alerts';

export const GET = scoped(async (_req, s, p) => json({ alert: await getAlertRecord(s.shopId, p.alertId) }));
