import { json, readBody, authed } from '@/lib/http';
import { z } from 'zod';
import { loadSampleData } from '@/modules/shops';

export const POST = authed(async (req, session, p) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json(await loadSampleData(session, p.shopId, body), 201);
});
