import { json, readQuery, scoped } from '@/lib/http';
import { z } from 'zod';
import { listAuditEventRecords } from '@/modules/shops';

export const GET = scoped(async (req, s) => {
  const q = readQuery(req, z.object({ limit: z.coerce.number().int().optional(), cursor: z.string().optional() }));
  return json(await listAuditEventRecords(s.shopId, q));
});
