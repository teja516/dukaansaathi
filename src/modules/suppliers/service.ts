import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { suppliers, supplierBills, supplierPayments } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { todayIST } from '@/lib/utils';
import { auditLog, changedFields } from '@/modules/shops';

function cleanPhone(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/[\s-]/g, '');
  if (!s) return null;
  if (!/^\+?\d{7,15}$/.test(s)) throw new HttpError(400, 'Enter a valid phone number');
  return s;
}

function payableSummary(bills: { remainingAmountPaise: number; dueDate: string }[], today: string) {
  let payable = 0;
  let nearest: string | null = null;
  let overdue = false;
  for (const b of bills) {
    if (b.remainingAmountPaise <= 0) continue;
    payable += b.remainingAmountPaise;
    if (!nearest || b.dueDate < nearest) nearest = b.dueDate;
    if (b.dueDate < today) overdue = true;
  }
  return { payable_paise: payable, nearest_unpaid_due_date: nearest, is_overdue: overdue };
}

export async function listSupplierRecords(
  shopId: string,
  query: { q?: string; filter?: 'all' | 'overdue'; sort?: 'highest_payable' | 'nearest_due' | 'name'; page?: number; limit?: number },
) {
  const today = todayIST();
  const conds = [eq(suppliers.shopId, shopId)];
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, '')}%`;
    conds.push(or(ilike(suppliers.name, like), ilike(suppliers.phoneNumber, like))!);
  }
  const rows = await db.select().from(suppliers).where(and(...conds));
  const bills = await db
    .select()
    .from(supplierBills)
    .where(and(eq(supplierBills.shopId, shopId), sql`${supplierBills.remainingAmountPaise} > 0`));
  const by = new Map<string, typeof bills>();
  for (const b of bills) by.set(b.supplierId, [...(by.get(b.supplierId) ?? []), b]);
  let items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone_number: r.phoneNumber,
    is_sample: !!r.isSample,
    ...payableSummary(by.get(r.id) ?? [], today),
  }));
  if (query.filter === 'overdue') items = items.filter((i) => i.is_overdue);
  const sort = query.sort ?? 'highest_payable';
  items.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'nearest_due') {
      if (!a.nearest_unpaid_due_date) return b.nearest_unpaid_due_date ? 1 : a.name.localeCompare(b.name);
      if (!b.nearest_unpaid_due_date) return -1;
      return a.nearest_unpaid_due_date.localeCompare(b.nearest_unpaid_due_date);
    }
    return b.payable_paise - a.payable_paise || a.name.localeCompare(b.name);
  });
  const total = items.length;
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const page = Math.max(query.page ?? 1, 1);
  return { items: items.slice((page - 1) * limit, page * limit), total };
}

async function findSupplier(shopId: string, id: string) {
  const [row] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.shopId, shopId), eq(suppliers.id, id)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Supplier not found');
  return row;
}

export async function createSupplierRecord(
  session: { userId: string; shopId: string },
  input: { name?: string; phoneNumber?: string | null; notes?: string | null; confirmDuplicate?: boolean },
) {
  const name = input.name?.trim();
  if (!name) throw new HttpError(400, 'Supplier name is required');
  if (name.length > 120) throw new HttpError(400, 'Name is too long (120 characters at most)');
  const [dup] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(and(eq(suppliers.shopId, session.shopId), sql`lower(${suppliers.name}) = ${name.toLowerCase()}`))
    .limit(1);
  if (dup && !input.confirmDuplicate) {
    throw new HttpError(409, 'A supplier with this name already exists. Save again to confirm.', { duplicate: true });
  }
  const [row] = await db
    .insert(suppliers)
    .values({ shopId: session.shopId, name, phoneNumber: cleanPhone(input.phoneNumber), notes: input.notes?.trim() || null })
    .returning();
  await auditLog(session.shopId, session.userId, 'create', 'supplier', row.id);
  return row;
}

export async function getSupplierDetailRecord(shopId: string, supplierId: string) {
  const supplier = await findSupplier(shopId, supplierId);
  const bills = await db
    .select()
    .from(supplierBills)
    .where(and(eq(supplierBills.shopId, shopId), eq(supplierBills.supplierId, supplierId)))
    .orderBy(desc(supplierBills.dueDate));
  const payments = await db
    .select()
    .from(supplierPayments)
    .where(and(eq(supplierPayments.shopId, shopId), eq(supplierPayments.supplierId, supplierId)))
    .orderBy(desc(supplierPayments.paymentDate));
  const activity = [
    ...bills.map((b) => ({ date: b.billDate, type: 'bill', amount_paise: b.amountPaise, source_id: b.id })),
    ...payments.filter((p) => !p.reversedAt).map((p) => ({ date: p.paymentDate, type: 'payment', amount_paise: p.amountPaise, source_id: p.id })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return {
    supplier,
    ...(({ payable_paise, nearest_unpaid_due_date }) => ({ payable_paise, nearest_unpaid_due_date }))(
      payableSummary(bills, todayIST()),
    ),
    bills: bills.map((b) => ({
      id: b.id,
      amount_paise: b.amountPaise,
      remaining_amount_paise: b.remainingAmountPaise,
      bill_date: b.billDate,
      due_date: b.dueDate,
      status: b.status,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      amount_paise: p.amountPaise,
      payment_date: p.paymentDate,
      payment_method: p.paymentMethod,
      supplier_bill_id: p.supplierBillId,
      reversed: !!p.reversedAt,
    })),
    activity,
  };
}

export async function updateSupplierRecord(
  session: { userId: string; shopId: string },
  supplierId: string,
  input: { name?: string; phoneNumber?: string | null; notes?: string | null },
) {
  const existingSupplier = await findSupplier(session.shopId, supplierId);
  const patch: Partial<typeof suppliers.$inferInsert> = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new HttpError(400, 'Supplier name is required');
    if (input.name.trim().length > 120) throw new HttpError(400, 'Name is too long (120 characters at most)');
    patch.name = input.name.trim();
  }
  if (input.phoneNumber !== undefined) patch.phoneNumber = cleanPhone(input.phoneNumber);
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  const diff = changedFields(existingSupplier as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  if (diff.changed) {
    await db.update(suppliers).set(patch).where(eq(suppliers.id, supplierId));
    await auditLog(session.shopId, session.userId, 'update', 'supplier', supplierId, { before: diff.before, after: diff.after });
  }
  return findSupplier(session.shopId, supplierId);
}

export async function deleteSupplierRecord(session: { userId: string; shopId: string }, supplierId: string) {
  await findSupplier(session.shopId, supplierId);
  const bills = await db.select({ id: supplierBills.id }).from(supplierBills).where(eq(supplierBills.supplierId, supplierId));
  const pays = await db.select({ id: supplierPayments.id }).from(supplierPayments).where(eq(supplierPayments.supplierId, supplierId));
  if (bills.length || pays.length) {
    throw new HttpError(409, 'This supplier has bills or payments and cannot be deleted', {
      billCount: bills.length,
      paymentCount: pays.length,
    });
  }
  await db.delete(suppliers).where(eq(suppliers.id, supplierId));
  await auditLog(session.shopId, session.userId, 'delete', 'supplier', supplierId);
}
