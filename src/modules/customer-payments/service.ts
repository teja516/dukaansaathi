import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  creditTransactions,
  customerPayments,
  customerPaymentAllocations,
  cashMovements,
  customers,
} from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { todayIST } from '@/lib/utils';
import { allocateInOrder } from '@/lib/allocation';
import { auditLog } from '@/modules/shops';

const METHODS = ['cash', 'upi', 'bank'] as const;
type Method = (typeof METHODS)[number];

interface Allocation {
  credit_transaction_id: string;
  amount_paise: number;
}

type Exec = Pick<typeof db, 'select'>;

/** Open credit sales for a customer, oldest first. If creditTransactionId is given, only that one. */
async function openCredits(exec: Exec, shopId: string, customerId: string, creditTransactionId?: string, lock = false) {
  const conds = [
    eq(creditTransactions.shopId, shopId),
    eq(creditTransactions.customerId, customerId),
    sql`${creditTransactions.remainingAmountPaise} > 0`,
  ];
  if (creditTransactionId) conds.push(eq(creditTransactions.id, creditTransactionId));
  const q = exec
    .select()
    .from(creditTransactions)
    .where(and(...conds))
    .orderBy(asc(creditTransactions.transactionDate), asc(creditTransactions.createdAt));
  return lock ? await q.for('update') : await q;
}

function allocate(credits: { id: string; remainingAmountPaise: number }[], amount: number): Allocation[] {
  return allocateInOrder(credits, amount).map((a) => ({ credit_transaction_id: a.id, amount_paise: a.amountPaise }));
}

export async function previewCustomerPaymentRecord(
  shopId: string,
  query: { customer_id?: string; credit_transaction_id?: string; amount_paise?: number },
) {
  if (!query.customer_id) throw new HttpError(400, 'Choose a customer');
  const credits = await openCredits(db, shopId, query.customer_id, query.credit_transaction_id);
  const outstanding = credits.reduce((s, c) => s + c.remainingAmountPaise, 0);
  const received = query.amount_paise ?? 0;
  if (received < 0) throw new HttpError(400, 'Amount cannot be negative');
  if (received > outstanding) throw new HttpError(400, 'Payment is more than the amount outstanding');
  return {
    outstanding_before_paise: outstanding,
    received_paise: received,
    outstanding_after_paise: outstanding - received,
    allocations: allocate(credits, received),
  };
}

export async function listCustomerPaymentRecords(
  shopId: string,
  query: { customer_id?: string; credit_transaction_id?: string; page?: number },
) {
  const conds = [eq(customerPayments.shopId, shopId)];
  if (query.customer_id) conds.push(eq(customerPayments.customerId, query.customer_id));
  if (query.credit_transaction_id) conds.push(eq(customerPayments.creditTransactionId, query.credit_transaction_id));
  const page = Math.max(query.page ?? 1, 1);
  return db
    .select()
    .from(customerPayments)
    .where(and(...conds))
    .orderBy(desc(customerPayments.paymentDate), desc(customerPayments.createdAt))
    .limit(50)
    .offset((page - 1) * 50);
}

export async function listCustomerPaymentAllocationRecords(shopId: string, customerPaymentId: string) {
  const [p] = await db
    .select({ id: customerPayments.id })
    .from(customerPayments)
    .where(and(eq(customerPayments.shopId, shopId), eq(customerPayments.id, customerPaymentId)))
    .limit(1);
  if (!p) throw new HttpError(404, 'Payment not found');
  return db
    .select()
    .from(customerPaymentAllocations)
    .where(eq(customerPaymentAllocations.customerPaymentId, customerPaymentId));
}

export async function createCustomerPaymentRecord(
  session: { userId: string; shopId: string },
  input: Record<string, unknown>,
) {
  const shopId = session.shopId;
  const customerId = typeof input.customerId === 'string' ? input.customerId : '';
  const key = typeof input.idempotencyKey === 'string' ? input.idempotencyKey.trim() : '';
  if (!key) throw new HttpError(400, 'idempotencyKey is required');
  const amount = input.amountPaise;
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    throw new HttpError(400, 'Payment amount must be greater than zero');
  }
  const method = (input.paymentMethod ?? 'cash') as Method;
  if (!METHODS.includes(method)) throw new HttpError(400, 'Choose cash, UPI or bank');
  const paymentDate = typeof input.paymentDate === 'string' && input.paymentDate ? input.paymentDate : todayIST();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || Number.isNaN(Date.parse(paymentDate))) throw new HttpError(400, 'Payment date is not valid');
  if (paymentDate > todayIST()) throw new HttpError(400, 'Payment date cannot be in the future');
  const creditId = typeof input.creditTransactionId === 'string' && input.creditTransactionId ? input.creditTransactionId : undefined;

  // A retried or double-tapped request returns the original record.
  const [existing] = await db
    .select()
    .from(customerPayments)
    .where(and(eq(customerPayments.shopId, shopId), eq(customerPayments.idempotencyKey, key)))
    .limit(1);
  if (existing) return existing;

  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.id, customerId)))
    .limit(1);
  if (!customer) throw new HttpError(400, 'Choose a customer');

  const payment = await db.transaction(async (tx) => {
    const credits = await openCredits(tx, shopId, customerId, creditId, true);
    const outstanding = credits.reduce((s, c) => s + c.remainingAmountPaise, 0);
    if (credits.length === 0) throw new HttpError(400, 'Nothing is outstanding for this customer');
    if (amount > outstanding) throw new HttpError(400, 'Payment is more than the amount outstanding');
    const allocations = allocate(credits, amount);

    const [row] = await tx
      .insert(customerPayments)
      .values({
        shopId,
        customerId,
        creditTransactionId: allocations[0].credit_transaction_id,
        amountPaise: amount,
        paymentDate,
        paymentMethod: method,
        note: typeof input.note === 'string' && input.note.trim() ? input.note.trim() : null,
        idempotencyKey: key,
      })
      .returning();

    for (const a of allocations) {
      const credit = credits.find((c) => c.id === a.credit_transaction_id)!;
      const remaining = credit.remainingAmountPaise - a.amount_paise;
      await tx.insert(customerPaymentAllocations).values({
        shopId,
        customerPaymentId: row.id,
        creditTransactionId: credit.id,
        amountPaise: a.amount_paise,
      });
      await tx
        .update(creditTransactions)
        .set({ remainingAmountPaise: remaining, status: remaining === 0 ? 'paid' : 'partially_paid' })
        .where(eq(creditTransactions.id, credit.id));
    }

    await tx.insert(cashMovements).values({
      shopId,
      direction: 'inflow',
      amountPaise: amount,
      paymentMethod: method,
      movementDate: paymentDate,
      customerPaymentId: row.id,
      sourceId: row.id,
      sourceRecordId: row.id,
    });
    return row;
  });

  await auditLog(shopId, session.userId, 'create', 'customer_payment', payment.id, { amountPaise: amount });
  return payment;
}

/**
 * Reverses a customer payment. The payment row is kept and marked reversed; the credit sales it
 * settled are restored and an opposite cash movement is posted, so history is never silently rewritten.
 */
export async function reverseCustomerPaymentRecord(session: { userId: string; shopId: string }, paymentId: string, reason: string) {
  const shopId = session.shopId;
  const note = reason.trim();
  if (!note) throw new HttpError(400, 'Please give a reason for reversing this payment');
  const result = await db.transaction(async (tx) => {
    const [pay] = await tx
      .select()
      .from(customerPayments)
      .where(and(eq(customerPayments.shopId, shopId), eq(customerPayments.id, paymentId)))
      .limit(1)
      .for('update');
    if (!pay) throw new HttpError(404, 'Payment not found');
    if (pay.reversedAt) throw new HttpError(409, 'This payment has already been reversed');
    const allocs = await tx.select().from(customerPaymentAllocations).where(eq(customerPaymentAllocations.customerPaymentId, pay.id));
    const restored: { creditTransactionId: string; amountPaise: number }[] = [];
    for (const a of allocs) {
      const [credit] = await tx.select().from(creditTransactions).where(eq(creditTransactions.id, a.creditTransactionId)).limit(1).for('update');
      if (!credit) continue;
      const remaining = credit.remainingAmountPaise + a.amountPaise;
      await tx
        .update(creditTransactions)
        .set({ remainingAmountPaise: remaining, status: remaining >= credit.amountPaise ? 'unpaid' : 'partially_paid' })
        .where(eq(creditTransactions.id, credit.id));
      restored.push({ creditTransactionId: credit.id, amountPaise: a.amountPaise });
    }
    await tx.insert(cashMovements).values({
      shopId,
      direction: 'outflow',
      amountPaise: pay.amountPaise,
      paymentMethod: pay.paymentMethod,
      movementDate: todayIST(),
      customerPaymentId: pay.id,
      sourceId: `reversal:${pay.id}`,
      sourceRecordId: pay.id,
    });
    await tx
      .update(customerPayments)
      .set({ reversedAt: new Date(), reversalReason: note, reversedByUserId: session.userId })
      .where(eq(customerPayments.id, pay.id));
    return { pay, restored };
  });
  await auditLog(shopId, session.userId, 'reverse', 'customer_payment', paymentId, {
    reason: note,
    before: { amountPaise: result.pay.amountPaise, paymentDate: result.pay.paymentDate },
    creditsRestored: result.restored,
  });
  const [row] = await db.select().from(customerPayments).where(eq(customerPayments.id, paymentId)).limit(1);
  return row;
}
