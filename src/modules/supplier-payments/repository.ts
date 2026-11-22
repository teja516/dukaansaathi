import { and, asc, eq } from 'drizzle-orm';
import { supplierPayments } from '@/db/schema';
import { db, type Db } from '@/lib/db';

/**
 * Private repository for the supplier-payments module.
 * The only code in this module that reads or writes supplier_payments.
 * A missing row returns null rather than throwing.
 */

export type SupplierPaymentRow = typeof supplierPayments.$inferSelect;
export type SupplierPaymentInsert = typeof supplierPayments.$inferInsert;
export type SupplierPaymentUpdate = Partial<
  Omit<SupplierPaymentInsert, 'id' | 'createdAt' | 'shopId'>
>;

/**
 * Executor accepted by every function: either the shared db client or a
 * transaction handle, so the service can run the payment insert together
 * with bill-status changes in one transaction.
 */
export type SupplierPaymentExecutor = Pick<Db, 'select' | 'insert' | 'update' | 'delete'>;

export interface ListSupplierPaymentsFilter {
  shopId: string;
  supplierId?: string;
  supplierBillId?: string;
  page?: number;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export async function findSupplierPayments(
  filter: ListSupplierPaymentsFilter,
  executor: SupplierPaymentExecutor = db,
): Promise<SupplierPaymentRow[]> {
  const page = Math.max(1, Math.floor(filter.page ?? 1));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(filter.pageSize ?? DEFAULT_PAGE_SIZE)),
  );

  const conditions = [eq(supplierPayments.shopId, filter.shopId)];
  if (filter.supplierId) {
    conditions.push(eq(supplierPayments.supplierId, filter.supplierId));
  }
  if (filter.supplierBillId) {
    conditions.push(eq(supplierPayments.supplierBillId, filter.supplierBillId));
  }

  return executor
    .select()
    .from(supplierPayments)
    .where(and(...conditions))
    .orderBy(asc(supplierPayments.paymentDate), asc(supplierPayments.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
}

export async function findSupplierPaymentById(
  id: string,
  shopId: string,
  executor: SupplierPaymentExecutor = db,
): Promise<SupplierPaymentRow | null> {
  const rows = await executor
    .select()
    .from(supplierPayments)
    .where(and(eq(supplierPayments.id, id), eq(supplierPayments.shopId, shopId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function findSupplierPaymentByIdempotencyKey(
  shopId: string,
  idempotencyKey: string,
  executor: SupplierPaymentExecutor = db,
): Promise<SupplierPaymentRow | null> {
  const rows = await executor
    .select()
    .from(supplierPayments)
    .where(
      and(
        eq(supplierPayments.shopId, shopId),
        eq(supplierPayments.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function insertSupplierPayment(
  data: SupplierPaymentInsert,
  executor: SupplierPaymentExecutor = db,
): Promise<SupplierPaymentRow | null> {
  const rows = await executor.insert(supplierPayments).values(data).returning();

  return rows[0] ?? null;
}

export async function updateSupplierPaymentRow(
  id: string,
  shopId: string,
  data: SupplierPaymentUpdate,
  executor: SupplierPaymentExecutor = db,
): Promise<SupplierPaymentRow | null> {
  const rows = await executor
    .update(supplierPayments)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(supplierPayments.id, id), eq(supplierPayments.shopId, shopId)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteSupplierPaymentRow(
  id: string,
  shopId: string,
  executor: SupplierPaymentExecutor = db,
): Promise<SupplierPaymentRow | null> {
  const rows = await executor
    .delete(supplierPayments)
    .where(and(eq(supplierPayments.id, id), eq(supplierPayments.shopId, shopId)))
    .returning();

  return rows[0] ?? null;
}