import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type UserUpdate = Partial<Omit<NewUserRow, 'id' | 'createdAt'>>;

export interface ListUsersOptions {
  shopId?: string;
  limit?: number;
  offset?: number;
}

export async function listUsers(options: ListUsersOptions = {}): Promise<UserRow[]> {
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const offset = Math.max(options.offset ?? 0, 0);
  const where = options.shopId ? eq(users.shopId, options.shopId) : undefined;

  return db
    .select()
    .from(users)
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  const rows = await db.select().from(users).where(eq(users.email, normalized)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByPasswordResetTokenHash(tokenHash: string): Promise<UserRow | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetTokenHash, tokenHash))
    .limit(1);
  return rows[0] ?? null;
}

export async function createUser(input: NewUserRow): Promise<UserRow> {
  const [row] = await db.insert(users).values(input).returning();
  return row;
}

export async function updateUser(id: string, input: UserUpdate): Promise<UserRow | null> {
  const rows = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteUser(id: string): Promise<boolean> {
  const rows = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });
  return rows.length > 0;
}

export async function incrementFailedLoginCount(id: string): Promise<UserRow | null> {
  const rows = await db
    .update(users)
    .set({
      failedLoginCount: sql`${users.failedLoginCount} + 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id)))
    .returning();
  return rows[0] ?? null;
}

export async function incrementSessionVersion(id: string): Promise<UserRow | null> {
  const rows = await db
    .update(users)
    .set({
      sessionVersion: sql`${users.sessionVersion} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, id))
    .returning();
  return rows[0] ?? null;
}