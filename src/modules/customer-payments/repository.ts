import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import { db, type Db } from '@/lib/db';
import {
  customerPayments,
  customerPaymentAllocations,
  supplierPaymentAllocations,
} from '@/db/schema';

/**
 * Repository for the customer-payments module.
 * The only code in this module that reads or writes its tables:
 *   customer_payments, customer_payment_allocations, supplier_payment_allocations.
 * Private to the module. A missing row returns null rather than throwing.
 */

export type CustomerPaymentRow = typeof customerPayments.$inferSelect;
export type CustomerPaymentInsert = typeof customerPayments.$inferInsert;
export type CustomerPaymentAllocationRow = typeof customerPaymentAllocations.$inferSelect;
export type CustomerPaymentAllocationInsert = typeof customerPaymentAllocations.$inferInsert;
export type SupplierPaymentAllocationRow = typeof supplierPaymentAllocations.$inferSelect;
export type SupplierPaymentAllocationInsert = typeof supplierPaymentAllocations.$inferInsert;

/** Anything that can run queries: the shared client or a transaction handle. */
export type Executor = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function clampLimit(limit?: number): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

function pageOffset(page: number | undefined, limit: number): number {
  const p = !page || !Number.isFinite(page) || page < 1 ? 1 : Math.floor(page);
  return (p - 1) * limit;
}

/* ------------------------------------------------------------------ */
/* customer_payments                                                    */
/* ------------------------------------------------------------------ */

export interface ListCustomerPaymentsFilter {
  shopId: string;
  customerId?: string;
  creditTransactionId?: string;
  page?: number;
  limit?: number;
}

/** Newest first: payment date, then creation time. */
export async function listCustomerPayments(
  filter: ListCustomerPaymentsFilter,
  executor: Executor = db,
): Promise<CustomerPaymentRow[]> {
  const conditions: SQL[] = [eq(customerPayments.shopId, filter.shopId)];
  if (filter.customerId) conditions.push(eq(customerPayments.customerId, filter.customerId));
  if (filter.creditTransactionId) {
    conditions.push(eq(customerPayments.creditTransactionId, filter.creditTransactionId));
  }

  const limit = clampLimit(filter.limit);
  return executor
    .select()
    .from(customerPayments)
    .where(and(...conditions))
    .orderBy(desc(customerPayments.paymentDate), desc(customerPayments.createdAt))
    .limit(limit)
    .offset(pageOffset(filter.page, limit));
}

export async function getCustomerPaymentById(
  id: string,
  executor: Executor = db,
): Promise<CustomerPaymentRow | null> {
  const rows = await executor
    .select()
    .from(customerPayments)
    .where(eq(customerPayments.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Looks up a payment already saved under this idempotency key for the shop.
 * Used so a repeated submit returns the original result.
 */
export async function findCustomerPaymentByIdempotencyKey(
  shopId: string,
  idempotencyKey: string,
  executor: Executor = db,
): Promise<CustomerPaymentRow | null> {
  const rows = await executor
    .select()
    .from(customerPayments)
    .where(
      and(
        eq(customerPayments.shopId, shopId),
        eq(customerPayments.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function createCustomerPayment(
  values: CustomerPaymentInsert,
  executor: Executor = db,
): Promise<CustomerPaymentRow> {
  const rows = await executor.insert(customerPayments).values(values).returning();
  return rows[0];
}

export async function updateCustomerPayment(
  id: string,
  patch: Partial<CustomerPaymentInsert>,
  executor: Executor = db,
): Promise<CustomerPaymentRow | null> {
  const rows = await executor
    .update(customerPayments)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(customerPayments.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteCustomerPayment(
  id: string,
  executor: Executor = db,
): Promise<CustomerPaymentRow | null> {
  const rows = await executor
    .delete(customerPayments)
    .where(eq(customerPayments.id, id))
    .returning();
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* customer_payment_allocations                                         */
/* ------------------------------------------------------------------ */

export interface ListCustomerPaymentAllocationsFilter {
  shopId?: string;
  customerPaymentId?: string;
  creditTransactionId?: string;
}

export async function listCustomerPaymentAllocations(
  filter: ListCustomerPaymentAllocationsFilter = {},
  executor: Executor = db,
): Promise<CustomerPaymentAllocationRow[]> {
  const conditions: SQL[] = [];
  if (filter.shopId) conditions.push(eq(customerPaymentAllocations.shopId, filter.shopId));
  if (filter.customerPaymentId) {
    conditions.push(eq(customerPaymentAllocations.customerPaymentId, filter.customerPaymentId));
  }
  if (filter.creditTransactionId) {
    conditions.push(eq(customerPaymentAllocations.creditTransactionId, filter.creditTransactionId));
  }

  return executor
    .select()
    .from(customerPaymentAllocations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(customerPaymentAllocations.createdAt));
}

export async function getCustomerPaymentAllocationById(
  id: string,
  executor: Executor = db,
): Promise<CustomerPaymentAllocationRow | null> {
  const rows = await executor
    .select()
    .from(customerPaymentAllocations)
    .where(eq(customerPaymentAllocations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Sum of allocations already applied to a credit sale. Used to derive the
 * remaining outstanding balance: credit amount minus this sum.
 */
export async function sumCustomerPaymentAllocationsForCreditTransaction(
  creditTransactionId: string,
  executor: Executor = db,
): Promise<number> {
  const rows = await executor
    .select({
      total: sql<number>`coalesce(sum(${customerPaymentAllocations.amountPaise}), 0)::int`,
    })
    .from(customerPaymentAllocations)
    .where(eq(customerPaymentAllocations.creditTransactionId, creditTransactionId));
  return Number(rows[0]?.total ?? 0);
}

export async function createCustomerPaymentAllocation(
  values: CustomerPaymentAllocationInsert,
  executor: Executor = db,
): Promise<CustomerPaymentAllocationRow> {
  const rows = await executor.insert(customerPaymentAllocations).values(values).returning();
  return rows[0];
}

/** Inserts many allocations for one payment in a single statement. */
export async function createCustomerPaymentAllocations(
  values: CustomerPaymentAllocationInsert[],
  executor: Executor = db,
): Promise<CustomerPaymentAllocationRow[]> {
  if (values.length === 0) return [];
  return executor.insert(customerPaymentAllocations).values(values).returning();
}

export async function updateCustomerPaymentAllocation(
  id: string,
  patch: Partial<CustomerPaymentAllocationInsert>,
  executor: Executor = db,
): Promise<CustomerPaymentAllocationRow | null> {
  const rows = await executor
    .update(customerPaymentAllocations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(customerPaymentAllocations.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteCustomerPaymentAllocation(
  id: string,
  executor: Executor = db,
): Promise<CustomerPaymentAllocationRow | null> {
  const rows = await executor
    .delete(customerPaymentAllocations)
    .where(eq(customerPaymentAllocations.id, id))
    .returning();
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* supplier_payment_allocations                                         */
/* ------------------------------------------------------------------ */

export interface ListSupplierPaymentAllocationsFilter {
  shopId?: string;
  supplierPaymentId?: string;
  supplierBillId?: string;
}

export async function listSupplierPaymentAllocations(
  filter: ListSupplierPaymentAllocationsFilter = {},
  executor: Executor = db,
): Promise<SupplierPaymentAllocationRow[]> {
  const conditions: SQL[] = [];
  if (filter.shopId) conditions.push(eq(supplierPaymentAllocations.shopId, filter.shopId));
  if (filter.supplierPaymentId) {
    conditions.push(eq(supplierPaymentAllocations.supplierPaymentId, filter.supplierPaymentId));
  }
  if (filter.supplierBillId) {
    conditions.push(eq(supplierPaymentAllocations.supplierBillId, filter.supplierBillId));
  }

  return executor
    .select()
    .from(supplierPaymentAllocations)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(supplierPaymentAllocations.createdAt));
}

export async function getSupplierPaymentAllocationById(
  id: string,
  executor: Executor = db,
): Promise<SupplierPaymentAllocationRow | null> {
  const rows = await executor
    .select()
    .from(supplierPaymentAllocations)
    .where(eq(supplierPaymentAllocations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function createSupplierPaymentAllocation(
  values: SupplierPaymentAllocationInsert,
  executor: Executor = db,
): Promise<SupplierPaymentAllocationRow> {
  const rows = await executor.insert(supplierPaymentAllocations).values(values).returning();
  return rows[0];
}

export async function updateSupplierPaymentAllocation(
  id: string,
  patch: Partial<SupplierPaymentAllocationInsert>,
  executor: Executor = db,
): Promise<SupplierPaymentAllocationRow | null> {
  const rows = await executor
    .update(supplierPaymentAllocations)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(supplierPaymentAllocations.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteSupplierPaymentAllocation(
  id: string,
  executor: Executor = db,
): Promise<SupplierPaymentAllocationRow | null> {
  const rows = await executor
    .delete(supplierPaymentAllocations)
    .where(eq(supplierPaymentAllocations.id, id))
    .returning();
  return rows[0] ?? null;
}