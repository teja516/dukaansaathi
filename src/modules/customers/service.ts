import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers, creditTransactions, customerPayments } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { formatPaise, todayIST } from '@/lib/utils';
import { auditLog, changedFields } from '@/modules/shops';

type DueStatus = 'clear' | 'partial' | 'overdue';

export interface CustomerBalance {
  outstanding_paise: number;
  overdue_paise: number;
  oldest_unpaid_date: string | null;
  due_status: DueStatus;
}

function summarise(
  open: { remainingAmountPaise: number; transactionDate: string; expectedPaymentDate: string | null; amountPaise: number }[],
  today: string,
): CustomerBalance {
  let outstanding = 0;
  let overdue = 0;
  let oldest: string | null = null;
  for (const c of open) {
    if (c.remainingAmountPaise <= 0) continue;
    outstanding += c.remainingAmountPaise;
    if (c.expectedPaymentDate && c.expectedPaymentDate < today) overdue += c.remainingAmountPaise;
    if (!oldest || c.transactionDate < oldest) oldest = c.transactionDate;
  }
  const due_status: DueStatus = overdue > 0 ? 'overdue' : outstanding > 0 ? 'partial' : 'clear';
  return { outstanding_paise: outstanding, overdue_paise: overdue, oldest_unpaid_date: oldest, due_status };
}

function cleanPhone(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/[\s-]/g, '');
  if (!s) return null;
  if (!/^\+?\d{7,15}$/.test(s)) throw new HttpError(400, 'Enter a valid phone number');
  return s;
}

export async function listCustomerRecords(
  shopId: string,
  query: { q?: string; filter?: 'all' | 'outstanding' | 'overdue'; sort?: 'highest_outstanding' | 'oldest_due' | 'name'; page?: number; limit?: number },
) {
  const today = todayIST();
  const conds = [eq(customers.shopId, shopId)];
  if (query.q) {
    const like = `%${query.q.replace(/[%_]/g, '')}%`;
    conds.push(or(ilike(customers.name, like), ilike(customers.phoneNumber, like))!);
  }
  const rows = await db.select().from(customers).where(and(...conds));
  const credits = await db
    .select()
    .from(creditTransactions)
    .where(and(eq(creditTransactions.shopId, shopId), sql`${creditTransactions.remainingAmountPaise} > 0`));
  const byCustomer = new Map<string, typeof credits>();
  for (const c of credits) {
    const list = byCustomer.get(c.customerId) ?? [];
    list.push(c);
    byCustomer.set(c.customerId, list);
  }
  let items = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone_number: r.phoneNumber,
    is_sample: !!r.isSample,
    ...summarise(byCustomer.get(r.id) ?? [], today),
  }));
  if (query.filter === 'outstanding') items = items.filter((i) => i.outstanding_paise > 0);
  if (query.filter === 'overdue') items = items.filter((i) => i.overdue_paise > 0);
  const sort = query.sort ?? 'highest_outstanding';
  items.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'oldest_due') {
      if (!a.oldest_unpaid_date) return b.oldest_unpaid_date ? 1 : a.name.localeCompare(b.name);
      if (!b.oldest_unpaid_date) return -1;
      return a.oldest_unpaid_date.localeCompare(b.oldest_unpaid_date);
    }
    return b.outstanding_paise - a.outstanding_paise || a.name.localeCompare(b.name);
  });
  const total = items.length;
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const page = Math.max(query.page ?? 1, 1);
  return { items: items.slice((page - 1) * limit, page * limit), total };
}

export async function createCustomerRecord(
  session: { userId: string; shopId: string },
  input: { name?: string; phoneNumber?: string | null; notes?: string | null; confirmDuplicate?: boolean },
) {
  const name = input.name?.trim();
  if (!name) throw new HttpError(400, 'Customer name is required');
  if (name.length > 120) throw new HttpError(400, 'Name is too long (120 characters at most)');
  const phone = cleanPhone(input.phoneNumber);
  // Similar names are only warned about, never merged. The owner can confirm and save anyway.
  const [sameName] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.shopId, session.shopId), sql`lower(${customers.name}) = ${name.toLowerCase()}`))
    .limit(1);
  if (sameName && !input.confirmDuplicate) {
    throw new HttpError(409, 'A customer with this name already exists. Save again to confirm.', { duplicate: true });
  }
  if (phone) {
    const [dup] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.shopId, session.shopId), eq(customers.phoneNumber, phone)))
      .limit(1);
    if (dup) throw new HttpError(409, 'A customer with this phone number already exists');
  }
  const [row] = await db
    .insert(customers)
    .values({ shopId: session.shopId, name, phoneNumber: phone, notes: input.notes?.trim() || null })
    .returning();
  await auditLog(session.shopId, session.userId, 'create', 'customer', row.id);
  return row;
}

async function findCustomer(shopId: string, customerId: string) {
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.id, customerId)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Customer not found');
  return row;
}

export async function getCustomerDetailRecord(shopId: string, customerId: string) {
  const customer = await findCustomer(shopId, customerId);
  const credits = await db
    .select()
    .from(creditTransactions)
    .where(and(eq(creditTransactions.shopId, shopId), eq(creditTransactions.customerId, customerId)))
    .orderBy(creditTransactions.transactionDate);
  const payments = await db
    .select()
    .from(customerPayments)
    .where(and(eq(customerPayments.shopId, shopId), eq(customerPayments.customerId, customerId)))
    .orderBy(desc(customerPayments.paymentDate));
  const open = credits.filter((c) => c.remainingAmountPaise > 0);
  const timeline = [
    ...credits.map((c) => ({ date: c.transactionDate, type: 'credit_sale', amount_paise: c.amountPaise, source_id: c.id })),
    ...payments.filter((p) => !p.reversedAt).map((p) => ({ date: p.paymentDate, type: 'payment', amount_paise: p.amountPaise, source_id: p.id })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return {
    customer,
    ...summarise(open, todayIST()),
    unpaid_credit_transactions: open.map((c) => ({
      id: c.id,
      amount_paise: c.amountPaise,
      remaining_amount_paise: c.remainingAmountPaise,
      transaction_date: c.transactionDate,
      expected_payment_date: c.expectedPaymentDate,
      status: c.status,
    })),
    payment_history: payments.map((p) => ({
      id: p.id,
      amount_paise: p.amountPaise,
      payment_date: p.paymentDate,
      payment_method: p.paymentMethod,
      credit_transaction_id: p.creditTransactionId,
      reversed: !!p.reversedAt,
      reversal_reason: p.reversalReason,
    })),
    timeline,
  };
}

export async function updateCustomerRecord(
  session: { userId: string; shopId: string },
  customerId: string,
  input: { name?: string; phoneNumber?: string | null; notes?: string | null },
) {
  const existingCustomer = await findCustomer(session.shopId, customerId);
  const patch: Partial<typeof customers.$inferInsert> = {};
  if (input.name !== undefined) {
    if (!input.name.trim()) throw new HttpError(400, 'Customer name is required');
    if (input.name.trim().length > 120) throw new HttpError(400, 'Name is too long (120 characters at most)');
    patch.name = input.name.trim();
  }
  if (input.phoneNumber !== undefined) {
    const phone = cleanPhone(input.phoneNumber);
    if (phone) {
      const [dup] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(and(eq(customers.shopId, session.shopId), eq(customers.phoneNumber, phone)))
        .limit(1);
      if (dup && dup.id !== customerId) throw new HttpError(409, 'A customer with this phone number already exists');
    }
    patch.phoneNumber = phone;
  }
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  const diff = changedFields(existingCustomer as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  if (diff.changed) {
    await db.update(customers).set(patch).where(eq(customers.id, customerId));
    await auditLog(session.shopId, session.userId, 'update', 'customer', customerId, { before: diff.before, after: diff.after });
  }
  return findCustomer(session.shopId, customerId);
}

export async function deleteCustomerRecord(session: { userId: string; shopId: string }, customerId: string) {
  await findCustomer(session.shopId, customerId);
  const [hasCredit] = await db
    .select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(eq(creditTransactions.customerId, customerId))
    .limit(1);
  if (hasCredit) throw new HttpError(409, 'This customer has credit history and cannot be deleted');
  await db.delete(customers).where(eq(customers.id, customerId));
  await auditLog(session.shopId, session.userId, 'delete', 'customer', customerId);
}

/** Polite reminder text. Uses the CURRENT outstanding amount; nothing is sent or stored. */
export async function buildReminderDraft(shopId: string, customerId: string, language: 'english' | 'hindi') {
  const customer = await findCustomer(shopId, customerId);
  const open = await db
    .select({ r: creditTransactions.remainingAmountPaise })
    .from(creditTransactions)
    .where(and(eq(creditTransactions.shopId, shopId), eq(creditTransactions.customerId, customerId)));
  const outstanding = open.reduce((s, c) => s + Math.max(c.r, 0), 0);
  const amount = formatPaise(outstanding);
  const text =
    language === 'hindi'
      ? `नमस्ते ${customer.name} जी, आपके ${amount} के बकाया भुगतान के संबंध में विनम्र अनुरोध है। कृपया सुविधा अनुसार भुगतान कर दें। धन्यवाद।`
      : `Hello ${customer.name}, a gentle reminder about your pending payment of ${amount}. Please pay at your convenience. Thank you.`;
  return { language, text, outstanding_paise: outstanding, as_of_ist_date: todayIST() };
}
