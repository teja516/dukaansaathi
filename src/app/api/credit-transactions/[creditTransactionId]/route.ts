import { json, readBody, scoped } from '@/lib/http';
import { z } from 'zod';
import {
  getCreditTransactionRecord,
  updateCreditTransactionRecord,
  deleteCreditTransactionRecord,
} from '@/modules/credit-transactions';

export const GET = scoped(async (_req, s, p) => json(await getCreditTransactionRecord(s.shopId, p.creditTransactionId)));

export const PATCH = scoped(async (req, s, p) => {
  const body = await readBody(req, z.record(z.unknown()));
  return json({ creditTransaction: await updateCreditTransactionRecord(s, p.creditTransactionId, body) });
});

export const DELETE = scoped(async (_req, s, p) => {
  await deleteCreditTransactionRecord(s, p.creditTransactionId);
  return new Response(null, { status: 204 });
});
