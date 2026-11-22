import { and, count, desc, eq, lt, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creditTransactions } from '@/db/schema';

export type CreditTransactionRow = typeof creditTransactions.$inferSelect;
export type CreditTransactionInsert = typeof creditTransactions.$inferInsert;

export type CreditTransactionStatus = 'unpaid' | 'partially_paid' | 'paid';
export type CreditTransactionExpectedFilter = 'any' | 'overdue' | 'none';

export interface FindCreditTransactionsOptions {
  shopId: string;
  /** Today's calendar date in Asia/Kolkata, formatted YYYY-MM-DD. Required for the overdue filter. */
  todayIst: string;
  customerId?: string;
  status?: CreditTransactionStatus;
  expected?: CreditTransactionExpectedFilter;
  limit?: number;
  offset?: number;
}

export interface FindCreditTransactionsResult {
  rows: CreditTransactionRow[];
  total: number;
}

export type CreditTransactionPatch = Partial<
  Omit<CreditTransactionInsert, 'id' | 'shopId' | 'createdAt'>
>;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);
}

function clampOffset(offset: number | undefined): number {
  if (offset === undefined || !Number.isFinite(offset)) return 0;
  return Math.max(Math.trunc(offset), 0);
}

function buildListConditions(opts: FindCreditTransactionsOptions): SQL[] {
  const conditions: SQL[] = [eq(creditTransactions.shopId, opts.shopId)];

  if (opts.customerId) {
    conditions.push(eq(creditTransactions.customerId, opts.customerId));
  }

  if (opts.status) {
    conditions.push(eq(creditTransactions.status, opts.status));
  }

  switch (opts.expected) {
    case 'none':
      conditions.push(sqlIsNull(creditTransactions.expectedPaymentDate));
      break;
    case 'overdue':
      conditions.push(lt(creditTransactions.expectedPaymentDate, opts.todayIst));
      conditions.push(sqlRemainingPositive());
      break;
    default:
      break;
  }

  return conditions;
}

function sqlIsNull(column: typeof creditTransactions.expectedPaymentDate): SQL {
  return isNullCondition(column);
}

function sqlRemainingPositive(): SQL {
  return gtCondition(creditTransactions.remainingAmountPaise, 0);
}

import { gt, isNull as isNullCondition } from 'drizzle-orm';

function gtCondition(
  column: typeof creditTransactions.remainingAmountPaise,
  value: number,
): SQL {
  return gt(column, value);
}

export async function findCreditTransactions(
  opts: FindCreditTransactionsOptions,
): Promise<FindCreditTransactionsResult> {
  const conditions = buildListConditions(opts);
  const whereClause = and(...conditions);
  const limit = clampLimit(opts.limit);
  const offset = clampOffset(opts.offset);

  const rows = await db
    .select()
    .from(creditTransactions)
    .where(whereClause)
    .orderBy(desc(creditTransactions.transactionDate), desc(creditTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  const [totalRow] = await db
    .select({ value: count() })
    .from(creditTransactions)
    .where(whereClause);

  return {
    rows,
    total: Number(totalRow?.value ?? 0),
  };
}

export async function findCreditTransactionById(
  creditTransactionId: string,
  shopId: string,
): Promise<CreditTransactionRow | null> {
  const rows = await db
    .select()
    .from(creditTransactions)
    .where(
      and(
        eq(creditTransactions.id, creditTransactionId),
        eq(creditTransactions.shopId, shopId),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function insertCreditTransaction(
  values: CreditTransactionInsert,
): Promise<CreditTransactionRow> {
  const rows = await db.insert(creditTransactions).values(values).returning();

  const row = rows[0];
  if (!row) {
    throw new Error('Insert into credit_transactions returned no row');
  }
  return row;
}

export async function updateCreditTransactionRow(
  creditTransactionId: string,
  shopId: string,
  patch: CreditTransactionPatch,
): Promise<CreditTransactionRow | null> {
  const rows = await db
    .update(creditTransactions)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(creditTransactions.id, creditTransactionId),
        eq(creditTransactions.shopId, shopId),
      ),
    )
    .returning();

  return rows[0] ?? null;
}

export async function deleteCreditTransactionRow(
  creditTransactionId: string,
  shopId: string,
): Promise<boolean> {
  const rows = await db
    .delete(creditTransactions)
    .where(
      and(
        eq(creditTransactions.id, creditTransactionId),
        eq(creditTransactions.shopId, shopId),
      ),
    )
    .returning({ id: creditTransactions.id });

  return rows.length > 0;
}