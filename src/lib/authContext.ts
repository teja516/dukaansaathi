import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { verifySessionToken, SESSION_MAX_AGE_SECONDS } from '@/lib/auth';

/** Request-scoped session: who is calling and which shop they own. */
export interface Session {
  userId: string;
  shopId: string | null;
  name: string;
  email: string;
}

export const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || 'app_session';

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  return readCookie(req.headers.get('cookie'), SESSION_COOKIE);
}

export async function getSession(req: Request): Promise<Session | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const claims = await verifySessionToken(token);
  if (!claims) return null;
  const [user] = await db.select().from(users).where(eq(users.id, claims.userId)).limit(1);
  if (!user || user.sessionVersion !== claims.sessionVersion) return null;
  return { userId: user.id, shopId: user.shopId, name: user.name, email: user.email };
}

export async function requireSession(req: Request): Promise<Session> {
  const session = await getSession(req);
  if (!session) throw new HttpError(401, 'Not signed in');
  return session;
}

/** Session that must also own a shop; most business endpoints need this. */
export async function requireShop(req: Request): Promise<Session & { shopId: string }> {
  const session = await requireSession(req);
  if (!session.shopId) throw new HttpError(409, 'Shop setup is not finished');
  return session as Session & { shopId: string };
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
