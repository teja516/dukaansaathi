import { json, scoped } from '@/lib/http';
import { reviewAlertRecord } from '@/modules/alerts';

export const POST = scoped(async (_req, s, p) => json({ alert: await reviewAlertRecord(s, p.alertId) }));
