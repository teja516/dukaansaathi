import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

/** Server-side password hashing (scrypt) and session tokens (JWT, HS256). */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function randomToken(): string {
  return randomBytes(32).toString('hex');
}

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s);
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export interface SessionClaims {
  userId: string;
  sessionVersion: number;
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ sv: claims.sessionVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    return { userId: payload.sub, sessionVersion: Number(payload.sv ?? 0) };
  } catch {
    return null;
  }
}
