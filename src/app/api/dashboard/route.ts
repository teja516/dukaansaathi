import { json, scoped } from '@/lib/http';
import { getDashboardSnapshot } from '@/modules/dashboard';

export const GET = scoped(async (_req, s) => json(await getDashboardSnapshot(s.shopId)));
