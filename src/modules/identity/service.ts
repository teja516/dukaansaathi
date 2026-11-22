import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, shops } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  sha256,
  randomToken,
} from '@/lib/auth';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const RESET_TOKEN_MINUTES = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserRecord = typeof users.$inferSelect;

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertPassword(password: string): void {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters');
  }
}

function publicUser(u: UserRecord) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    shop_id: u.shopId,
    last_login_at: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  };
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const name = input.name?.trim();
  const email = normEmail(input.email ?? '');
  if (!name) throw new HttpError(400, 'Name is required');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  assertPassword(input.password);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) throw new HttpError(409, 'An account with this email already exists');
  const [created] = await db
    .insert(users)
    .values({ name, email, passwordHash: hashPassword(input.password), passwordChangedAt: new Date() })
    .returning();
  return { id: created.id, name: created.name, email: created.email, shop_id: created.shopId };
}

export async function loginUser(input: { email: string; password: string }) {
  const email = normEmail(input.email ?? '');
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const invalid = new HttpError(401, 'Incorrect email or password');
  if (!user) {
    // Burn comparable time so unknown emails are not distinguishable.
    verifyPassword(input.password ?? '', hashPassword('x'));
    throw invalid;
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new HttpError(429, 'Too many failed attempts. Try again in a few minutes.');
  }
  if (!verifyPassword(input.password ?? '', user.passwordHash)) {
    const failed = user.failedLoginCount + 1;
    await db
      .update(users)
      .set({
        failedLoginCount: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : user.lockedUntil,
      })
      .where(eq(users.id, user.id));
    throw invalid;
  }
  await db
    .update(users)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() })
    .where(eq(users.id, user.id));
  const token = await signSessionToken({ userId: user.id, sessionVersion: user.sessionVersion });
  return {
    token,
    body: {
      user: { id: user.id, name: user.name, email: user.email },
      shop_id: user.shopId,
      token,
    },
  };
}

export async function logoutUser(userId: string) {
  // Bumping the version invalidates every outstanding token for this user.
  const [u] = await db.select({ v: users.sessionVersion }).from(users).where(eq(users.id, userId)).limit(1);
  if (u) await db.update(users).set({ sessionVersion: u.v + 1 }).where(eq(users.id, userId));
}

export async function getAuthMeResponse(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new HttpError(401, 'Not signed in');
  let shop = null;
  if (user.shopId) {
    const [s] = await db.select().from(shops).where(eq(shops.id, user.shopId)).limit(1);
    if (s) {
      shop = {
        id: s.id,
        shop_name: s.shopName,
        interface_language: s.interfaceLanguage,
        setup_completed_at: s.setupCompletedAt ? s.setupCompletedAt.toISOString() : null,
      };
    }
  }
  return { user: publicUser(user), shop };
}

export async function updateAuthMeProfile(userId: string, input: { name?: string; email?: string }) {
  const patch: Partial<typeof users.$inferInsert> = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new HttpError(400, 'Name is required');
    patch.name = input.name.trim();
  }
  if (input.email !== undefined) {
    const email = normEmail(input.email);
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
    const [clash] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (clash && clash.id !== userId) throw new HttpError(409, 'That email is already in use');
    patch.email = email;
  }
  if (Object.keys(patch).length) await db.update(users).set(patch).where(eq(users.id, userId));
  return getAuthMeResponse(userId);
}

export async function changeUserPassword(userId: string, input: { current_password: string; new_password: string }) {
  assertPassword(input.new_password);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !verifyPassword(input.current_password ?? '', user.passwordHash)) {
    throw new HttpError(400, 'Current password is incorrect');
  }
  await db
    .update(users)
    .set({
      passwordHash: hashPassword(input.new_password),
      passwordChangedAt: new Date(),
      sessionVersion: user.sessionVersion + 1,
    })
    .where(eq(users.id, userId));
  return { success: true };
}

export const FORGOT_PASSWORD_MESSAGE = 'If an account exists for that email, a reset link has been prepared.';

/**
 * Stores a hashed reset token. There is no email provider in this project, so the
 * reset link is written to the server log (development only) instead of being sent.
 */
export async function requestPasswordReset(emailInput: string) {
  const email = normEmail(emailInput ?? '');
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user) {
    const token = randomToken();
    await db
      .update(users)
      .set({
        passwordResetTokenHash: sha256(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60_000),
        passwordResetRequestedAt: new Date(),
        passwordResetUsedAt: null,
      })
      .where(eq(users.id, user.id));
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] password reset link for ${email}: /reset-password?token=${token}`);
    }
  }
  return { message: FORGOT_PASSWORD_MESSAGE };
}

export async function completePasswordReset(input: { token: string; password: string }) {
  assertPassword(input.password);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetTokenHash, sha256(input.token ?? '')))
    .limit(1);
  const bad = new HttpError(400, 'This reset link is invalid or has expired');
  if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date() || user.passwordResetUsedAt) {
    throw bad;
  }
  await db
    .update(users)
    .set({
      passwordHash: hashPassword(input.password),
      passwordChangedAt: new Date(),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetUsedAt: new Date(),
      sessionVersion: user.sessionVersion + 1,
      failedLoginCount: 0,
      lockedUntil: null,
    })
    .where(eq(users.id, user.id));
  return { success: true };
}
