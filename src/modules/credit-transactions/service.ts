import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creditTransactions, customers, customerPayments, customerPaymentAllocations } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { todayIST } from '@/lib/utils';
import { auditLog, changedFields } from '@/modules/shops';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function posInt(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) throw new HttpError(400, `${label} must be greater than zero`);
  return v;
}

function dateOrNull(v: unknown, label: string): string | null {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw new HttpError(400, `${label} must be a valid date`);
  return v;
}

async function findTx(shopId: string, id: string) {
  const [row] = await db
    .select()
    .from(creditTransactions)
    .where(and(eq(creditTransactions.shopId, shopId), eq(creditTransactions.id, id)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Credit sale not found');
  return row;
}

export async function listCreditTransactionRecords(
  shopId: string,
  query: { customer_id?: string; status?: 'unpaid' | 'partially_paid' | 'paid'; expected?: 'any' | 'overdue' | 'none'; page?: number; limit?: number },
) {
  const conds = [eq(creditTransactions.shopId, shopId)];
  if (query.customer_id) conds.push(eq(creditTransactions.customerId, query.customer_id));
  if (query.status) conds.push(eq(creditTransactions.status, query.status));
  if (query.expected === 'overdue') {
    conds.push(sql`${creditTransactions.expectedPaymentDate} < ${todayIST()}`);
    conds.push(sql`${creditTransactions.remainingAmountPaise} > 0`);
  }
  if (query.expected === 'none') conds.push(sql`${creditTransactions.expectedPaymentDate} is null`);
  if (query.expected === 'any') conds.push(sql`${creditTransactions.expectedPaymentDate} is not null`);
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const page = Math.max(query.page ?? 1, 1);
  const rows = await db
    .select({ tx: creditTransactions, customerName: customers.name })
    .from(creditTransactions)
    .innerJoin(customers, eq(customers.id, creditTransactions.customerId))
    .where(and(...conds))
    .orderBy(desc(creditTransactions.transactionDate), desc(creditTransactions.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(creditTransactions)
    .where(and(...conds));
  return {
    items: rows.map(({ tx, customerName }) => ({
      id: tx.id,
      customer_id: tx.customerId,
      customer_name: customerName,
      amount_paise: tx.amountPaise,
      remaining_amount_paise: tx.remainingAmountPaise,
      transaction_date: tx.transactionDate,
      expected_payment_date: tx.expectedPaymentDate,
      description: tx.description,
      status: tx.status,
      is_sample: !!tx.isSample,
    })),
    total: count,
  };
}

export async function createCreditTransactionRecord(
  session: { userId: string; shopId: string },
  input: Record<string, unknown>,
) {
  const customerId = typeof input.customerId === 'string' ? input.customerId : '';
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.shopId, session.shopId), eq(customers.id, customerId)))
    .limit(1);
  if (!customer) throw new HttpError(400, 'Choose a customer');
  const amount = posInt(input.amountPaise, 'Amount');
  const transactionDate = dateOrNull(input.transactionDate, 'Sale date') ?? todayIST();
  const expected = dateOrNull(input.expectedPaymentDate, 'Expected payment date');
  if (expected && expected < transactionDate) throw new HttpError(400, 'Expected payment date cannot be before the sale date');
  const [row] = await db
    .insert(creditTransactions)
    .values({
      shopId: session.shopId,
      customerId,
      amountPaise: amount,
      remainingAmountPaise: amount,
      transactionDate,
      expectedPaymentDate: expected,
      description: typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null,
      status: 'unpaid',
    })
    .returning();
  await auditLog(session.shopId, session.userId, 'create', 'credit_transaction', row.id, { amountPaise: amount });
  return row;
}

export async function getCreditTransactionRecord(shopId: string, id: string) {
  const tx = await findTx(shopId, id);
  const [customer] = await db.select({ id: customers.id, name: customers.name }).from(customers).where(eq(customers.id, tx.customerId));
  // Through allocations, so a payment that was split across several credits shows on each of them.
  const payments = await db
    .select({ p: customerPayments, applied: customerPaymentAllocations.amountPaise })
    .from(customerPaymentAllocations)
    .innerJoin(customerPayments, eq(customerPayments.id, customerPaymentAllocations.customerPaymentId))
    .where(and(eq(customerPaymentAllocations.shopId, shopId), eq(customerPaymentAllocations.creditTransactionId, id)))
    .orderBy(desc(customerPayments.paymentDate), desc(customerPayments.createdAt));
  return {
    credit_transaction: tx,
    customer,
    remaining_amount_paise: tx.remainingAmountPaise,
    status: tx.status,
    linked_payments: payments.map(({ p, applied }) => ({
      id: p.id,
      amount_paise: applied,
      payment_amount_paise: p.amountPaise,
      payment_date: p.paymentDate,
      payment_method: p.paymentMethod,
      reversed: !!p.reversedAt,
      reversal_reason: p.reversalReason,
    })),
  };
}

export async function updateCreditTransactionRecord(
  session: { userId: string; shopId: string },
  id: string,
  input: Record<string, unknown>,
) {
  const tx = await findTx(session.shopId, id);
  const paid = tx.amountPaise - tx.remainingAmountPaise;
  const patch: Partial<typeof creditTransactions.$inferInsert> = {};
  if (input.amountPaise !== undefined) {
    const amount = posInt(input.amountPaise, 'Amount');
    if (amount < paid) throw new HttpError(400, 'Amount cannot be less than what has already been paid');
    patch.amountPaise = amount;
    patch.remainingAmountPaise = amount - paid;
    patch.status = amount - paid === 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid';
  }
  if (input.transactionDate !== undefined) patch.transactionDate = dateOrNull(input.transactionDate, 'Sale date') ?? tx.transactionDate;
  if (input.expectedPaymentDate !== undefined) patch.expectedPaymentDate = dateOrNull(input.expectedPaymentDate, 'Expected payment date');
  if (input.description !== undefined) patch.description = typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null;
  const finalSale = patch.transactionDate ?? tx.transactionDate;
  const finalExpected = patch.expectedPaymentDate === undefined ? tx.expectedPaymentDate : patch.expectedPaymentDate;
  if (finalExpected && finalExpected < finalSale) throw new HttpError(400, 'Expected payment date cannot be before the sale date');
  const diff = changedFields(tx as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  if (diff.changed) {
    await db.update(creditTransactions).set(patch).where(eq(creditTransactions.id, id));
    await auditLog(session.shopId, session.userId, 'update', 'credit_transaction', id, { before: diff.before, after: diff.after });
  }
  return findTx(session.shopId, id);
}

export async function deleteCreditTransactionRecord(session: { userId: string; shopId: string }, id: string) {
  await findTx(session.shopId, id);
  const [linked] = await db
    .select({ id: customerPaymentAllocations.id })
    .from(customerPaymentAllocations)
    .where(eq(customerPaymentAllocations.creditTransactionId, id))
    .limit(1);
  const [direct] = await db.select({ id: customerPayments.id }).from(customerPayments).where(eq(customerPayments.creditTransactionId, id)).limit(1);
  if (linked || direct) throw new HttpError(409, 'This credit sale has payment history and cannot be deleted. Reverse the payment if it was a mistake, and edit the amount instead.');
  await db.delete(creditTransactions).where(eq(creditTransactions.id, id));
  await auditLog(session.shopId, session.userId, 'delete', 'credit_transaction', id);
}
