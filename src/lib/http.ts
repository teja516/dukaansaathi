import { ZodError, type ZodTypeAny, type z } from 'zod';
import { HttpError, requireShop, requireSession, type Session } from '@/lib/authContext';

type Ctx = { params: Promise<Record<string, string>> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 100_000;
const MAX_TEXT_LENGTH = 1000;

export function json(data: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) return json({ error: err.message, ...(err.extra ?? {}) }, err.status);
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const where = first?.path.length ? `${first.path.join('.')}: ` : '';
    return json({ error: `${where}${first?.message ?? 'Invalid request'}` }, 400);
  }
  console.error('[api]', err);
  return json({ error: 'Internal server error' }, 500);
}

/** Public endpoint. Path ids that are not valid UUIDs are "not found", never a database error. */
export function open(
  fn: (req: Request, params: Record<string, string>) => Promise<Response>,
): (req: Request, ctx: Ctx) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const params = ctx?.params ? await ctx.params : {};
      for (const [k, v] of Object.entries(params)) {
        if (k.toLowerCase().endsWith('id') && !UUID_RE.test(v)) throw new HttpError(404, 'Not found');
      }
      return await fn(req, params);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/** Endpoint requiring a signed-in user (shop optional). */
export function authed(
  fn: (req: Request, session: Session, params: Record<string, string>) => Promise<Response>,
): (req: Request, ctx: Ctx) => Promise<Response> {
  return open(async (req, params) => fn(req, await requireSession(req), params));
}

/** Endpoint requiring a signed-in user with a shop. Passes shopId. */
export function scoped(
  fn: (req: Request, session: Session & { shopId: string }, params: Record<string, string>) => Promise<Response>,
): (req: Request, ctx: Ctx) => Promise<Response> {
  return open(async (req, params) => fn(req, await requireShop(req), params));
}

/**
 * Server-side input guards that apply to every JSON body:
 * size cap, text length cap, and any `...Id` field must be a UUID (so a bad id is a 400, not a DB error).
 */
function guardBody(raw: unknown): void {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') {
      if (v.length > MAX_TEXT_LENGTH) throw new HttpError(400, 'Text is too long');
      if (/Id$/.test(k) && v !== '' && !UUID_RE.test(v)) throw new HttpError(400, 'Invalid id');
    }
  }
}

export async function readBody<S extends ZodTypeAny>(req: Request, schema: S): Promise<z.infer<S>> {
  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, 'Request is too large');
  let raw: unknown = {};
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) throw new HttpError(413, 'Request is too large');
    raw = text ? JSON.parse(text) : {};
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(400, 'Request body must be valid JSON');
  }
  guardBody(raw);
  return schema.parse(raw);
}

export function readQuery<S extends ZodTypeAny>(req: Request, schema: S): z.infer<S> {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    if (v === '') return;
    if (/_id$/.test(k) && !UUID_RE.test(v)) throw new HttpError(400, 'Invalid id');
    if (v.length > MAX_TEXT_LENGTH) throw new HttpError(400, 'Text is too long');
    obj[k] = v;
  });
  return schema.parse(obj);
}

// ---------------------------------------------------------------------------------------------
// Simple in-memory rate limiter for unauthenticated endpoints (login, register, password reset).
// One process only: enough to slow brute force on a single server; use a shared store if scaled out.
// ---------------------------------------------------------------------------------------------
const globalForLimit = globalThis as unknown as { __dukaanHits?: Map<string, number[]> };
const hits = (globalForLimit.__dukaanHits ??= new Map<string, number[]>());

export function rateLimit(req: Request, bucket: string, limit: number, windowMs: number): void {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    throw new HttpError(429, 'Too many requests. Please wait a minute and try again.');
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  }
}
