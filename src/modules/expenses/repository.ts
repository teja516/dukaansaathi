import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expens } from '@/db/schema';

export type ExpensRow = typeof expens.$inferSelect;
export type ExpensInsert = typeof expens.$inferInsert;

export type ExpensCategory = ExpensRow['category'];
export type ExpensStatus = ExpensRow['status'];

export interface ListExpensFilters {
  category?: ExpensCategory;
  status?: ExpensStatus;
}

/**
 * Lists expenses for one shop. Always scoped by shopId.
 * Paid history is ordered by payment date (newest first);
 * everything else (upcoming unpaid) is ordered by due date (earliest first).
 */
export async function listExpenses(
  shopId: string,
  filters: ListExpensFilters = {},
): Promise<ExpensRow[]> {
  const conditions = [eq(expens.shopId, shopId)];

  if (filters.category !== undefined) {
    conditions.push(eq(expens.category, filters.category));
  }
  if (filters.status !== undefined) {
    conditions.push(eq(expens.status, filters.status));
  }

  const isPaidView = filters.status === 'paid';

  const rows = await db
    .select()
    .from(expens)
    .where(and(...conditions))
    .orderBy(
      ...(isPaidView
        ? [desc(expens.paymentDate), desc(expens.expenseDate)]
        : [asc(expens.dueDate), desc(expens.createdAt)]),
    );

  return rows;
}

/**
 * Returns one expense belonging to the given shop, or null if it does not exist
 * or belongs to another shop.
 */
export async function getExpensById(
  expenseId: string,
  shopId: string,
): Promise<ExpensRow | null> {
  const rows = await db
    .select()
    .from(expens)
    .where(and(eq(expens.id, expenseId), eq(expens.shopId, shopId)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Finds an expense previously saved under the same idempotency key for this shop.
 * Used to return the same result on a repeated submit or network retry.
 */
export async function findExpenseByIdempotencyKey(
  shopId: string,
  idempotencyKey: string,
): Promise<ExpensRow | null> {
  const rows = await db
    .select()
    .from(expens)
    .where(and(eq(expens.shopId, shopId), eq(expens.idempotencyKey, idempotencyKey)))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Inserts a new expense row and returns it.
 */
export async function createExpens(values: ExpensInsert): Promise<ExpensRow> {
  const rows = await db.insert(expens).values(values).returning();

  const created = rows[0];
  if (!created) {
    throw new Error('Failed to insert expense');
  }
  return created;
}

/**
 * Updates an expense belonging to the given shop. Returns the updated row,
 * or null if no matching row exists for this shop.
 */
export async function updateExpens(
  expenseId: string,
  shopId: string,
  values: Partial<ExpensInsert>,
): Promise<ExpensRow | null> {
  const rows = await db
    .update(expens)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(expens.id, expenseId), eq(expens.shopId, shopId)))
    .returning();

  return rows[0] ?? null;
}

/**
 * Deletes an expense belonging to the given shop.
 * Returns true if a row was removed, false if no matching row existed.
 */
export async function deleteExpens(expenseId: string, shopId: string): Promise<boolean> {
  const rows = await db
    .delete(expens)
    .where(and(eq(expens.id, expenseId), eq(expens.shopId, shopId)))
    .returning({ id: expens.id });

  return rows.length > 0;
}