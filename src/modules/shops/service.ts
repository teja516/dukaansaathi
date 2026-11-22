import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  shops,
  users,
  auditEvents,
  customers,
  suppliers,
  creditTransactions,
  supplierBills,
  expens,
} from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { addDays, todayIST } from '@/lib/utils';

type ShopRecord = typeof shops.$inferSelect;

export async function auditLog(
  shopId: string,
  actorUserId: string,
  actionType: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
) {
  await db.insert(auditEvents).values({ shopId, actorUserId, actionType, entityType, entityId, metadata: metadata ?? null });
}

export { changedFields } from '@/lib/changes';
import { changedFields } from '@/lib/changes';

export async function listAuditEventRecords(shopId: string, query: { limit?: number; cursor?: string }) {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const offset = query.cursor ? Math.max(parseInt(query.cursor, 10) || 0, 0) : 0;
  const rows = await db
    .select({ e: auditEvents, actor: users.name })
    .from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorUserId))
    .where(eq(auditEvents.shopId, shopId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(limit + 1)
    .offset(offset);
  return {
    items: rows.slice(0, limit).map(({ e, actor }) => ({
      id: e.id,
      created_at: e.createdAt.toISOString(),
      actor_name: actor ?? null,
      action_type: e.actionType,
      entity_type: e.entityType,
      entity_id: e.entityId,
      metadata: e.metadata,
    })),
    next_cursor: rows.length > limit ? String(offset + limit) : null,
  };
}

function assertOwn(session: { shopId: string | null }, shopId: string): void {
  if (session.shopId !== shopId) throw new HttpError(404, 'Shop not found');
}

function nonNegInt(v: unknown, label: string): number {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    throw new HttpError(400, `${label} must be a whole number of paise, zero or more`);
  }
  return v;
}

export async function createShopForUser(
  session: { userId: string; shopId: string | null },
  input: Record<string, unknown>,
): Promise<ShopRecord> {
  if (session.shopId) throw new HttpError(409, 'You already have a shop');
  const shopName = typeof input.shopName === 'string' ? input.shopName.trim() : '';
  if (!shopName) throw new HttpError(400, 'Shop name is required');
  if (shopName.length > 120) throw new HttpError(400, 'Name is too long (120 characters at most)');
  const language = input.interfaceLanguage === 'hindi' ? 'hindi' : 'english';
  const [shop] = await db
    .insert(shops)
    .values({
      shopName,
      ownerName: typeof input.ownerName === 'string' && input.ownerName.trim() ? input.ownerName.trim() : null,
      interfaceLanguage: language,
      openingCashBalancePaise: input.openingCashBalancePaise === undefined ? 0 : nonNegInt(input.openingCashBalancePaise, 'Opening cash'),
      openingBankBalancePaise: input.openingBankBalancePaise === undefined ? 0 : nonNegInt(input.openingBankBalancePaise, 'Opening bank balance'),
    })
    .returning();
  await db.update(users).set({ shopId: shop.id, preferredLanguage: language }).where(eq(users.id, session.userId));
  await auditLog(shop.id, session.userId, 'create', 'shop', shop.id);
  return shop;
}

export async function getShopForUser(session: { shopId: string | null }, shopId: string): Promise<ShopRecord> {
  assertOwn(session, shopId);
  const [shop] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
  if (!shop) throw new HttpError(404, 'Shop not found');
  return shop;
}

export async function updateShopForUser(
  session: { userId: string; shopId: string | null },
  shopId: string,
  input: Record<string, unknown>,
): Promise<ShopRecord> {
  assertOwn(session, shopId);
  const patch: Partial<typeof shops.$inferInsert> = {};
  if (input.shopName !== undefined) {
    if (typeof input.shopName !== 'string' || !input.shopName.trim()) throw new HttpError(400, 'Shop name is required');
    patch.shopName = input.shopName.trim();
  }
  if (input.ownerName !== undefined) patch.ownerName = typeof input.ownerName === 'string' && input.ownerName.trim() ? input.ownerName.trim() : null;
  if (input.openingCashBalancePaise !== undefined) patch.openingCashBalancePaise = nonNegInt(input.openingCashBalancePaise, 'Opening cash');
  if (input.openingBankBalancePaise !== undefined) patch.openingBankBalancePaise = nonNegInt(input.openingBankBalancePaise, 'Opening bank balance');
  if (input.cashSafetyThresholdPaise !== undefined) patch.cashSafetyThresholdPaise = nonNegInt(input.cashSafetyThresholdPaise, 'Safety threshold');
  if (input.interfaceLanguage !== undefined) {
    if (input.interfaceLanguage !== 'english' && input.interfaceLanguage !== 'hindi') throw new HttpError(400, 'Unsupported language');
    patch.interfaceLanguage = input.interfaceLanguage;
  }
  const [before] = await db.select().from(shops).where(eq(shops.id, shopId)).limit(1);
  const diff = changedFields(before as unknown as Record<string, unknown>, patch as Record<string, unknown>);
  if (Object.keys(patch).length) await db.update(shops).set(patch).where(eq(shops.id, shopId));
  if (patch.interfaceLanguage) await db.update(users).set({ preferredLanguage: patch.interfaceLanguage }).where(eq(users.id, session.userId));
  if (diff.changed) await auditLog(shopId, session.userId, 'update', 'shop', shopId, { before: diff.before, after: diff.after });
  return getShopForUser(session, shopId);
}

export async function completeShopSetup(
  session: { userId: string; shopId: string | null },
  shopId: string,
  input: Record<string, unknown>,
): Promise<ShopRecord> {
  assertOwn(session, shopId);
  if (input.reviewConfirmed === false) throw new HttpError(400, 'Please review and confirm your setup');
  await db.update(shops).set({ setupCompletedAt: new Date() }).where(eq(shops.id, shopId));
  await auditLog(shopId, session.userId, 'complete_setup', 'shop', shopId);
  return getShopForUser(session, shopId);
}

/** Inserts a small, clearly marked sample data set. Refuses if the shop already has records. */
export async function loadSampleData(
  session: { userId: string; shopId: string | null },
  shopId: string,
  input: Record<string, unknown>,
) {
  assertOwn(session, shopId);
  if (input.confirmed === false) throw new HttpError(400, 'Please confirm loading sample data');
  const existing = await db.select({ id: customers.id }).from(customers).where(eq(customers.shopId, shopId)).limit(1);
  if (existing.length) throw new HttpError(409, 'Sample data can only be loaded into an empty shop');

  const today = todayIST();
  // Spec Part 10 demo story, dated relative to today (IST) so every figure stays consistent:
  //   Ravi owes 2,400 (expected in 10 days: the one used for the "15 days late" what-if),
  //   Suresh owes 1,200 and is already 5 days late, Lakshmi owes 800 (expected in 5 days).
  //   ABC Distributors 12,000 due in 3 days, Krishna Wholesale 5,000 due in 7 days.
  //   Unpaid expenses: rent 8,000, electricity 1,500, other 2,500.
  const cust = await db
    .insert(customers)
    .values([
      { shopId, name: 'Ravi', phoneNumber: '9000000001', isSample: true },
      { shopId, name: 'Suresh', phoneNumber: '9000000002', isSample: true },
      { shopId, name: 'Lakshmi', phoneNumber: '9000000003', isSample: true },
    ])
    .returning();
  const sup = await db
    .insert(suppliers)
    .values([
      { shopId, name: 'ABC Distributors', phoneNumber: '9000000011', isSample: true },
      { shopId, name: 'Krishna Wholesale', phoneNumber: '9000000012', isSample: true },
    ])
    .returning();

  const credit = (customerId: string, amount: number, ago: number, expectedIn: number, description: string) => ({
    shopId,
    customerId,
    amountPaise: amount,
    remainingAmountPaise: amount,
    transactionDate: addDays(today, -ago),
    expectedPaymentDate: addDays(today, expectedIn),
    description,
    status: 'unpaid' as const,
    isSample: true,
  });
  const credits = await db
    .insert(creditTransactions)
    .values([
      credit(cust[0].id, 240000, 14, 10, 'Monthly groceries'),
      credit(cust[1].id, 120000, 25, -5, 'Rice and oil'),
      credit(cust[2].id, 80000, 6, 5, 'Festival items'),
    ])
    .returning();

  const bill = (supplierId: string, amount: number, ago: number, dueIn: number, reference: string) => ({
    shopId,
    supplierId,
    amountPaise: amount,
    remainingAmountPaise: amount,
    billDate: addDays(today, -ago),
    dueDate: addDays(today, dueIn),
    status: 'unpaid' as const,
    reference,
    isSample: true,
  });
  const bills = await db
    .insert(supplierBills)
    .values([bill(sup[0].id, 1200000, 12, 3, 'ABC-1042'), bill(sup[1].id, 500000, 8, 7, 'KW-218')])
    .returning();

  const exp = await db
    .insert(expens)
    .values([
      { shopId, category: 'rent', amountPaise: 800000, expenseDate: today, dueDate: addDays(today, 9), status: 'unpaid', idempotencyKey: `sample-${shopId}-rent`, isSample: true },
      { shopId, category: 'electricity', amountPaise: 150000, expenseDate: today, dueDate: addDays(today, 12), status: 'unpaid', idempotencyKey: `sample-${shopId}-power`, isSample: true },
      { shopId, category: 'other', amountPaise: 250000, expenseDate: today, dueDate: addDays(today, 20), status: 'unpaid', description: 'Packing material and transport', idempotencyKey: `sample-${shopId}-other`, isSample: true },
    ])
    .returning();

  await auditLog(shopId, session.userId, 'load_sample_data', 'shop', shopId);
  return {
    loaded: true,
    customers_added: cust.length,
    suppliers_added: sup.length,
    records_added: credits.length + bills.length + exp.length,
  };
}
