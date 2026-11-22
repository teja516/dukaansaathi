import { and, asc, eq, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { supplierBills } from '@/db/schema';

export type SupplierBillRow = typeof supplierBills.$inferSelect;
export type SupplierBillInsert = typeof supplierBills.$inferInsert;
export type SupplierBillStatus = SupplierBillRow['status'];

export interface ListSupplierBillsFilter {
  shopId: string;
  supplierId?: string;
  status?: SupplierBillStatus;
  /** Inclusive upper bound on due date, formatted YYYY-MM-DD (IST), computed by the service. */
  dueOnOrBefore?: string;
}

export async function findSupplierBills(filter: ListSupplierBillsFilter): Promise<SupplierBillRow[]> {
  const conditions = [eq(supplierBills.shopId, filter.shopId)];

  if (filter.supplierId !== undefined) {
    conditions.push(eq(supplierBills.supplierId, filter.supplierId));
  }
  if (filter.status !== undefined) {
    conditions.push(eq(supplierBills.status, filter.status));
  }
  if (filter.dueOnOrBefore !== undefined) {
    conditions.push(lte(supplierBills.dueDate, filter.dueOnOrBefore));
  }

  return db
    .select()
    .from(supplierBills)
    .where(and(...conditions))
    .orderBy(asc(supplierBills.dueDate), asc(supplierBills.id));
}

export async function findSupplierBillById(
  supplierBillId: string,
  shopId: string,
): Promise<SupplierBillRow | null> {
  const rows = await db
    .select()
    .from(supplierBills)
    .where(and(eq(supplierBills.id, supplierBillId), eq(supplierBills.shopId, shopId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function insertSupplierBill(values: SupplierBillInsert): Promise<SupplierBillRow> {
  const rows = await db.insert(supplierBills).values(values).returning();
  const row = rows[0];
  if (!row) {
    throw new Error('supplier_bills insert returned no row');
  }
  return row;
}

export async function updateSupplierBillRow(
  supplierBillId: string,
  shopId: string,
  changes: Partial<Omit<SupplierBillInsert, 'id' | 'shopId' | 'createdAt'>>,
): Promise<SupplierBillRow | null> {
  const rows = await db
    .update(supplierBills)
    .set({ ...changes, updatedAt: new Date() })
    .where(and(eq(supplierBills.id, supplierBillId), eq(supplierBills.shopId, shopId)))
    .returning();

  return rows[0] ?? null;
}

export async function deleteSupplierBillRow(supplierBillId: string, shopId: string): Promise<boolean> {
  const rows = await db
    .delete(supplierBills)
    .where(and(eq(supplierBills.id, supplierBillId), eq(supplierBills.shopId, shopId)))
    .returning({ id: supplierBills.id });

  return rows.length > 0;
}