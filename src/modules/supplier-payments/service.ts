import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { supplierBills, supplierPayments, supplierPaymentAllocations, cashMovements, suppliers } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { todayIST } from '@/lib/utils';
import { allocateInOrder } from '@/lib/allocation';
import { auditLog } from '@/modules/shops';

const METHODS = ['cash', 'upi', 'bank'] as const;
type Method = (typeof METHODS)[number];

interface Allocation {
  supplier_bill_id: string;
  amount_paise: number;
}

type Exec = Pick<typeof db, 'select'>;

/**
 * Open bills for a supplier, oldest due date first (the default allocation).
 * If supplierBillId is given only that bill is used (manual choice).
 */
async function openBills(exec: Exec, shopId: string, supplierId: string | undefined, billId: string | undefined, lock = false) {
  const conds = [eq(supplierBills.shopId, shopId), sql`${supplierBills.remainingAmountPaise} > 0`];
  if (billId) conds.push(eq(supplierBills.id, billId));
  if (supplierId) conds.push(eq(supplierBills.supplierId, supplierId));
  const q = exec
    .select()
    .from(supplierBills)
    .where(and(...conds))
    .orderBy(asc(supplierBills.dueDate), asc(supplierBills.createdAt));
  return lock ? await q.for('update') : await q;
}

function allocate(bills: { id: string; remainingAmountPaise: number }[], amount: number): Allocation[] {
  return allocateInOrder(bills, amount).map((a) => ({ supplier_bill_id: a.id, amount_paise: a.amountPaise }));
}

export async function previewSupplierPaymentRecord(
  shopId: string,
  query: { supplier_id?: string; supplier_bill_id?: string; amount_paise?: number },
) {
  if (!query.supplier_id && !query.supplier_bill_id) throw new HttpError(400, 'Choose a supplier');
  const bills = await openBills(db, shopId, query.supplier_id, query.supplier_bill_id);
  const total = bills.reduce((s, b) => s + b.remainingAmountPaise, 0);
  const paid = query.amount_paise ?? 0;
  if (paid < 0) throw new HttpError(400, 'Amount cannot be negative');
  if (paid > total) throw new HttpError(400, 'Payment is more than the amount still owed');
  const allocations = allocate(bills, paid);
  return {
    supplier_bill_id: allocations[0]?.supplier_bill_id ?? bills[0]?.id ?? '',
    remaining_before_paise: total,
    paid_paise: paid,
    remaining_after_paise: total - paid,
    allocations,
  };
}

export async function listSupplierPaymentRecords(
  shopId: string,
  query: { supplier_id?: string; supplier_bill_id?: string; page?: number },
) {
  const conds = [eq(supplierPayments.shopId, shopId)];
  if (query.supplier_id) conds.push(eq(supplierPayments.supplierId, query.supplier_id));
  if (query.supplier_bill_id) {
    // A payment may be split across bills; match through its allocations too.
    conds.push(
      sql`(${supplierPayments.supplierBillId} = ${query.supplier_bill_id} or exists (select 1 from ${supplierPaymentAllocations} a where a.supplier_payment_id = ${supplierPayments.id} and a.supplier_bill_id = ${query.supplier_bill_id}))`,
    );
  }
  const page = Math.max(query.page ?? 1, 1);
  return db
    .select()
    .from(supplierPayments)
    .where(and(...conds))
    .orderBy(desc(supplierPayments.paymentDate), desc(supplierPayments.createdAt))
    .limit(50)
    .offset((page - 1) * 50);
}

export async function listSupplierPaymentAllocationRecords(shopId: string, supplierPaymentId: string) {
  const [p] = await db
    .select({ id: supplierPayments.id })
    .from(supplierPayments)
    .where(and(eq(supplierPayments.shopId, shopId), eq(supplierPayments.id, supplierPaymentId)))
    .limit(1);
  if (!p) throw new HttpError(404, 'Payment not found');
  return db.select().from(supplierPaymentAllocations).where(eq(supplierPaymentAllocations.supplierPaymentId, supplierPaymentId));
}

export async function createSupplierPaymentRecord(
  session: { userId: string; shopId: string },
  input: Record<string, unknown>,
) {
  const shopId = session.shopId;
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
  const billId = typeof input.supplierBillId === 'string' && input.supplierBillId ? input.supplierBillId : undefined;
  const supplierId = typeof input.supplierId === 'string' && input.supplierId ? input.supplierId : undefined;
  if (!billId && !supplierId) throw new HttpError(400, 'Choose a supplier or a bill');

  const [existing] = await db
    .select()
    .from(supplierPayments)
    .where(and(eq(supplierPayments.shopId, shopId), eq(supplierPayments.idempotencyKey, key)))
    .limit(1);
  if (existing) return existing;

  if (supplierId) {
    const [sup] = await db.select({ id: suppliers.id }).from(suppliers).where(and(eq(suppliers.shopId, shopId), eq(suppliers.id, supplierId))).limit(1);
    if (!sup) throw new HttpError(400, 'Choose a supplier');
  }

  const payment = await db.transaction(async (tx) => {
    const bills = await openBills(tx, shopId, supplierId, billId, true);
    if (bills.length === 0) throw new HttpError(400, 'Nothing is owed on the chosen bill or supplier');
    const owed = bills.reduce((s, b) => s + b.remainingAmountPaise, 0);
    if (amount > owed) throw new HttpError(400, 'Payment is more than the amount still owed');
    const allocations = allocate(bills, amount);
    const first = bills.find((b) => b.id === allocations[0].supplier_bill_id)!;

    const [row] = await tx
      .insert(supplierPayments)
      .values({
        shopId,
        supplierId: first.supplierId,
        supplierBillId: first.id,
        amountPaise: amount,
        paymentDate,
        paymentMethod: method,
        note: typeof input.note === 'string' && input.note.trim() ? input.note.trim() : null,
        idempotencyKey: key,
      })
      .returning();

    for (const a of allocations) {
      const bill = bills.find((b) => b.id === a.supplier_bill_id)!;
      const remaining = bill.remainingAmountPaise - a.amount_paise;
      await tx.insert(supplierPaymentAllocations).values({ shopId, supplierPaymentId: row.id, supplierBillId: bill.id, amountPaise: a.amount_paise });
      await tx
        .update(supplierBills)
        .set({ remainingAmountPaise: remaining, status: remaining === 0 ? 'paid' : 'partially_paid' })
        .where(eq(supplierBills.id, bill.id));
    }
    await tx.insert(cashMovements).values({
      shopId,
      direction: 'outflow',
      amountPaise: amount,
      paymentMethod: method,
      movementDate: paymentDate,
      supplierPaymentId: row.id,
      sourceId: row.id,
      sourceRecordId: row.id,
    });
    return row;
  });

  await auditLog(shopId, session.userId, 'create', 'supplier_payment', payment.id, { amountPaise: amount });
  return payment;
}

/**
 * Reverses a supplier payment. The payment row is kept and marked reversed; the bills it paid are
 * restored and an opposite cash movement is posted, so history is never silently rewritten.
 */
export async function reverseSupplierPaymentRecord(session: { userId: string; shopId: string }, paymentId: string, reason: string) {
  const shopId = session.shopId;
  const note = reason.trim();
  if (!note) throw new HttpError(400, 'Please give a reason for reversing this payment');
  const result = await db.transaction(async (tx) => {
    const [pay] = await tx
      .select()
      .from(supplierPayments)
      .where(and(eq(supplierPayments.shopId, shopId), eq(supplierPayments.id, paymentId)))
      .limit(1)
      .for('update');
    if (!pay) throw new HttpError(404, 'Payment not found');
    if (pay.reversedAt) throw new HttpError(409, 'This payment has already been reversed');
    const allocs = await tx.select().from(supplierPaymentAllocations).where(eq(supplierPaymentAllocations.supplierPaymentId, pay.id));
    const restored: { billId: string; amountPaise: number }[] = [];
    for (const a of allocs) {
      const [bill] = await tx.select().from(supplierBills).where(eq(supplierBills.id, a.supplierBillId)).limit(1).for('update');
      if (!bill) continue;
      const remaining = bill.remainingAmountPaise + a.amountPaise;
      await tx
        .update(supplierBills)
        .set({ remainingAmountPaise: remaining, status: remaining >= bill.amountPaise ? 'unpaid' : 'partially_paid' })
        .where(eq(supplierBills.id, bill.id));
      restored.push({ billId: bill.id, amountPaise: a.amountPaise });
    }
    await tx.insert(cashMovements).values({
      shopId,
      direction: 'inflow',
      amountPaise: pay.amountPaise,
      paymentMethod: pay.paymentMethod,
      movementDate: todayIST(),
      supplierPaymentId: pay.id,
      sourceId: `reversal:${pay.id}`,
      sourceRecordId: pay.id,
    });
    await tx
      .update(supplierPayments)
      .set({ reversedAt: new Date(), reversalReason: note, reversedByUserId: session.userId })
      .where(eq(supplierPayments.id, pay.id));
    return { pay, restored };
  });
  await auditLog(shopId, session.userId, 'reverse', 'supplier_payment', paymentId, {
    reason: note,
    before: { amountPaise: result.pay.amountPaise, paymentDate: result.pay.paymentDate },
    billsRestored: result.restored,
  });
  const [row] = await db.select().from(supplierPayments).where(eq(supplierPayments.id, paymentId)).limit(1);
  return row;
}
