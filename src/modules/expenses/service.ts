import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { expens, cashMovements } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { todayIST } from '@/lib/utils';
import { auditLog, changedFields } from '@/modules/shops';

const CATEGORIES = ['rent', 'electricity', 'wages', 'transport', 'other'] as const;
const METHODS = ['cash', 'upi', 'bank'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

type Category = (typeof CATEGORIES)[number];
type Method = (typeof METHODS)[number];

function date(v: unknown, label: string): string {
  if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw new HttpError(400, `${label} must be a valid date`);
  return v;
}

async function findExpense(shopId: string, id: string) {
  const [row] = await db
    .select()
    .from(expens)
    .where(and(eq(expens.shopId, shopId), eq(expens.id, id)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Expense not found');
  return row;
}

export async function listExpenseRecords(
  shopId: string,
  query: { category?: Category; status?: 'unpaid' | 'paid' | 'cancelled'; from?: string; to?: string; page?: number },
) {
  const conds = [eq(expens.shopId, shopId)];
  if (query.category) conds.push(eq(expens.category, query.category));
  if (query.status) conds.push(eq(expens.status, query.status));
  if (query.from) conds.push(gte(expens.expenseDate, query.from));
  if (query.to) conds.push(lte(expens.expenseDate, query.to));
  const page = Math.max(query.page ?? 1, 1);
  return db
    .select()
    .from(expens)
    .where(and(...conds))
    .orderBy(desc(expens.expenseDate), desc(expens.createdAt))
    .limit(50)
    .offset((page - 1) * 50);
}

export async function getExpenseRecord(shopId: string, id: string) {
  return findExpense(shopId, id);
}

export async function createExpenseRecord(
  session: { userId: string; shopId: string },
  input: Record<string, unknown>,
) {
  const shopId = session.shopId;
  const key = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
  if (!key) throw new HttpError(400, 'idempotencyKey is required');
  const [existing] = await db.select().from(expens).where(and(eq(expens.shopId, shopId), eq(expens.idempotencyKey, key))).limit(1);
  if (existing) return existing;

  const category = input.category as Category;
  if (!CATEGORIES.includes(category)) throw new HttpError(400, 'Choose an expense category');
  const amount = input.amountPaise;
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) throw new HttpError(400, 'Amount must be greater than zero');
  const expenseDate = input.expenseDate ? date(input.expenseDate, 'Expense date') : todayIST();
  const paid = input.status === 'paid';
  const dueDate = input.dueDate ? date(input.dueDate, 'Due date') : null;
  if (!paid && !dueDate) throw new HttpError(400, 'An unpaid expense needs a due date');
  let paymentDate: string | null = null;
  let method: Method | null = null;
  if (paid) {
    paymentDate = input.paymentDate ? date(input.paymentDate, 'Payment date') : todayIST();
    if (paymentDate > todayIST()) throw new HttpError(400, 'Payment date cannot be in the future');
    method = (input.paymentMethod ?? 'cash') as Method;
    if (!METHODS.includes(method)) throw new HttpError(400, 'Choose cash, UPI or bank');
  }

  const row = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(expens)
      .values({
        shopId,
        category,
        amountPaise: amount,
        expenseDate,
        dueDate,
        status: paid ? 'paid' : 'unpaid',
        paymentDate,
        paymentMethod: method,
        description: typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null,
        idempotencyKey: key,
      })
      .returning();
    if (paid && paymentDate && method) {
      await tx.insert(cashMovements).values({
        shopId,
        direction: 'outflow',
        amountPaise: amount,
        paymentMethod: method,
        movementDate: paymentDate,
        expenseId: created.id,
        sourceId: created.id,
        sourceRecordId: created.id,
      });
    }
    return created;
  });
  await auditLog(shopId, session.userId, 'create', 'expense', row.id, { amountPaise: amount });
  return row;
}

export async function updateExpenseRecord(
  session: { userId: string; shopId: string },
  id: string,
  input: Record<string, unknown>,
) {
  const e = await findExpense(session.shopId, id);
  if (e.status !== 'unpaid') throw new HttpError(409, 'Only unpaid expenses can be edited');
  const patch: Partial<typeof expens.$inferInsert> = {};
  if (input.category !== undefined) {
    if (!CATEGORIES.includes(input.category as Category)) throw new HttpError(400, 'Choose an expense category');
    patch.category = input.category as Category;
  }
  if (input.amountPaise !== undefined) {
    if (typeof input.amountPaise !== 'number' || !Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
      throw new HttpError(400, 'Amount must be greater than zero');
    }
    patch.amountPaise = input.amountPaise;
  }
  if (input.expenseDate !== undefined) patch.expenseDate = date(input.expenseDate, 'Expense date');
  if (input.dueDate !== undefined) patch.dueDate = date(input.dueDate, 'Due date');
  if (input.description !== undefined) patch.description = typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null;
  const diff = changedFields(e as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  if (diff.changed) {
    await db.update(expens).set(patch).where(eq(expens.id, id));
    await auditLog(session.shopId, session.userId, 'update', 'expense', id, { before: diff.before, after: diff.after });
  }
  return findExpense(session.shopId, id);
}

export async function markExpensePaid(
  session: { userId: string; shopId: string },
  id: string,
  input: { payment_date?: string; payment_method?: string },
) {
  const e = await findExpense(session.shopId, id);
  if (e.status !== 'unpaid') throw new HttpError(409, 'This expense is not unpaid');
  const paymentDate = input.payment_date ? date(input.payment_date, 'Payment date') : todayIST();
  if (paymentDate > todayIST()) throw new HttpError(400, 'Payment date cannot be in the future');
  const method = (input.payment_method ?? 'cash') as Method;
  if (!METHODS.includes(method)) throw new HttpError(400, 'Choose cash, UPI or bank');
  await db.transaction(async (tx) => {
    await tx.update(expens).set({ status: 'paid', paymentDate, paymentMethod: method }).where(eq(expens.id, id));
    await tx.insert(cashMovements).values({
      shopId: session.shopId,
      direction: 'outflow',
      amountPaise: e.amountPaise,
      paymentMethod: method,
      movementDate: paymentDate,
      expenseId: id,
      sourceId: id,
      sourceRecordId: id,
    });
  });
  await auditLog(session.shopId, session.userId, 'mark_paid', 'expense', id);
  return findExpense(session.shopId, id);
}

export async function cancelExpense(session: { userId: string; shopId: string }, id: string) {
  const e = await findExpense(session.shopId, id);
  if (e.status !== 'unpaid') throw new HttpError(409, 'Only unpaid expenses can be cancelled');
  await db.update(expens).set({ status: 'cancelled' }).where(eq(expens.id, id));
  await auditLog(session.shopId, session.userId, 'cancel', 'expense', id);
  return findExpense(session.shopId, id);
}
