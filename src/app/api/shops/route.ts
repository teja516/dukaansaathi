import { json, readBody, authed } from '@/lib/http';
import { z } from 'zod';
import { createShopForUser } from '@/modules/shops';

export const POST = authed(async (req, session) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ shop: await createShopForUser(session, body) }, 201);
});
