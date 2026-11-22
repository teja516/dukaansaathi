import { json, readBody, authed } from '@/lib/http';
import { z } from 'zod';
import { getShopForUser, updateShopForUser } from '@/modules/shops';

export const GET = authed(async (_req, session, p) => json({ shop: await getShopForUser(session, p.shopId) }));

export const PATCH = authed(async (req, session, p) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ shop: await updateShopForUser(session, p.shopId, body) });
});
