import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { supplierBills, suppliers, supplierPayments, supplierPaymentAllocations } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { addDays, todayIST } from '@/lib/utils';
import { auditLog, changedFields } from '@/modules/shops';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function posInt(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v <= 0) throw new HttpError(400, `${label} must be greater than zero`);
  return v;
}

function date(v: unknown, label: string): string {
  if (typeof v !== 'string' || !DATE_RE.test(v) || Number.isNaN(Date.parse(v))) throw new HttpError(400, `${label} must be a valid date`);
  return v;
}

async function findBill(shopId: string, id: string) {
  const [row] = await db
    .select()
    .from(supplierBills)
    .where(and(eq(supplierBills.shopId, shopId), eq(supplierBills.id, id)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Bill not found');
  return row;
}

export async function listSupplierBillRecords(
  shopId: string,
  query: { status?: 'unpaid' | 'partially_paid' | 'paid' | 'overdue'; supplier_id?: string; due_within_days?: number; page?: number },
) {
  const today = todayIST();
  const conds = [eq(supplierBills.shopId, shopId)];
  if (query.supplier_id) conds.push(eq(supplierBills.supplierId, query.supplier_id));
  if (query.status === 'overdue') {
    conds.push(sql`${supplierBills.remainingAmountPaise} > 0`);
    conds.push(sql`${supplierBills.dueDate} < ${today}`);
  } else if (query.status) {
    conds.push(eq(supplierBills.status, query.status));
  }
  if (query.due_within_days !== undefined) {
    conds.push(sql`${supplierBills.remainingAmountPaise} > 0`);
    conds.push(sql`${supplierBills.dueDate} <= ${addDays(today, query.due_within_days)}`);
  }
  const page = Math.max(query.page ?? 1, 1);
  const rows = await db
    .select({ bill: supplierBills, supplierName: suppliers.name })
    .from(supplierBills)
    .innerJoin(suppliers, eq(suppliers.id, supplierBills.supplierId))
    .where(and(...conds))
    .orderBy(supplierBills.dueDate, desc(supplierBills.createdAt))
    .limit(50)
    .offset((page - 1) * 50);
  return rows.map(({ bill, supplierName }) => ({
    id: bill.id,
    supplier_id: bill.supplierId,
    supplier_name: supplierName,
    bill_date: bill.billDate,
    due_date: bill.dueDate,
    amount_paise: bill.amountPaise,
    remaining_amount_paise: bill.remainingAmountPaise,
    status: bill.status,
    is_sample: !!bill.isSample,
    overdue: bill.remainingAmountPaise > 0 && bill.dueDate < today,
  }));
}

export async function createSupplierBillRecord(
  session: { userId: string; shopId: string },
  input: Record<string, unknown>,
) {
  const supplierId = typeof input.supplierId === 'string' ? input.supplierId : '';
  const [supplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.shopId, session.shopId), eq(suppliers.id, supplierId)))
    .limit(1);
  if (!supplier) throw new HttpError(400, 'Choose a supplier');
  const amount = posInt(input.amountPaise, 'Amount');
  const billDate = input.billDate ? date(input.billDate, 'Bill date') : todayIST();
  const dueDate = date(input.dueDate, 'Due date');
  if (dueDate < billDate) throw new HttpError(400, 'Due date cannot be before the bill date');
  const [row] = await db
    .insert(supplierBills)
    .values({
      shopId: session.shopId,
      supplierId,
      amountPaise: amount,
      remainingAmountPaise: amount,
      billDate,
      dueDate,
      description: typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null,
      reference: typeof input.reference === 'string' && input.reference.trim() ? input.reference.trim() : null,
      status: 'unpaid',
    })
    .returning();
  await auditLog(session.shopId, session.userId, 'create', 'supplier_bill', row.id, { amountPaise: amount });
  return row;
}

export async function getSupplierBillRecord(shopId: string, id: string) {
  const bill = await findBill(shopId, id);
  const rows = await db
    .select({ p: supplierPayments, applied: supplierPaymentAllocations.amountPaise })
    .from(supplierPaymentAllocations)
    .innerJoin(supplierPayments, eq(supplierPayments.id, supplierPaymentAllocations.supplierPaymentId))
    .where(and(eq(supplierPaymentAllocations.shopId, shopId), eq(supplierPaymentAllocations.supplierBillId, id)))
    .orderBy(desc(supplierPayments.paymentDate), desc(supplierPayments.createdAt));
  // amountPaise is the part applied to THIS bill; paymentAmountPaise is the whole payment.
  const payments = rows.map(({ p, applied }) => ({ ...p, amountPaise: applied, paymentAmountPaise: p.amountPaise }));
  return {
    bill,
    paid_amount_paise: bill.amountPaise - bill.remainingAmountPaise,
    remaining_amount_paise: bill.remainingAmountPaise,
    payments,
  };
}

export async function updateSupplierBillRecord(
  session: { userId: string; shopId: string },
  id: string,
  input: Record<string, unknown>,
) {
  const bill = await findBill(session.shopId, id);
  const paid = bill.amountPaise - bill.remainingAmountPaise;
  const patch: Partial<typeof supplierBills.$inferInsert> = {};
  if (input.amountPaise !== undefined) {
    const amount = posInt(input.amountPaise, 'Amount');
    if (amount < paid) throw new HttpError(400, 'Amount cannot be less than what has already been paid');
    patch.amountPaise = amount;
    patch.remainingAmountPaise = amount - paid;
    patch.status = amount - paid === 0 ? 'paid' : paid > 0 ? 'partially_paid' : 'unpaid';
  }
  if (input.billDate !== undefined) patch.billDate = date(input.billDate, 'Bill date');
  if (input.dueDate !== undefined) patch.dueDate = date(input.dueDate, 'Due date');
  if (input.description !== undefined) patch.description = typeof input.description === 'string' && input.description.trim() ? input.description.trim() : null;
  if (input.reference !== undefined) patch.reference = typeof input.reference === 'string' && input.reference.trim() ? input.reference.trim() : null;
  if ((patch.dueDate ?? bill.dueDate) < (patch.billDate ?? bill.billDate)) {
    throw new HttpError(400, 'Due date cannot be before the bill date');
  }
  const diff = changedFields(bill as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  if (diff.changed) {
    await db.update(supplierBills).set(patch).where(eq(supplierBills.id, id));
    await auditLog(session.shopId, session.userId, 'update', 'supplier_bill', id, { before: diff.before, after: diff.after });
  }
  return findBill(session.shopId, id);
}

export async function deleteSupplierBillRecord(session: { userId: string; shopId: string }, id: string) {
  await findBill(session.shopId, id);
  const [linked] = await db
    .select({ id: supplierPaymentAllocations.id })
    .from(supplierPaymentAllocations)
    .where(eq(supplierPaymentAllocations.supplierBillId, id))
    .limit(1);
  const [direct] = await db.select({ id: supplierPayments.id }).from(supplierPayments).where(eq(supplierPayments.supplierBillId, id)).limit(1);
  if (linked || direct) throw new HttpError(409, 'This bill has payment history and cannot be deleted. Reverse the payment if it was a mistake, and edit the amount instead.');
  await db.delete(supplierBills).where(eq(supplierBills.id, id));
  await auditLog(session.shopId, session.userId, 'delete', 'supplier_bill', id);
}
