import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { suppliers } from '@/db/schema';

export type SupplierRow = typeof suppliers.$inferSelect;
export type NewSupplierRow = typeof suppliers.$inferInsert;

export interface ListSupplierRowsOptions {
  q?: string;
  limit: number;
  offset: number;
}

export interface SupplierRowPatch {
  name?: string;
  phoneNumber?: string | null;
  notes?: string | null;
}

/** Escapes LIKE wildcards so user input is matched literally. */
function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Lists suppliers belonging to one shop, ordered by name.
 * Every query is scoped by shopId; the caller must pass the shop from the
 * authenticated session, never from the request body.
 */
export async function listSupplierRowsForShop(
  shopId: string,
  opts: ListSupplierRowsOptions,
): Promise<SupplierRow[]> {
  const q = opts.q?.trim();
  const searchCondition = q
    ? (() => {
        const pattern = `%${escapeLike(q)}%`;
        return or(
          ilike(suppliers.name, pattern),
          ilike(suppliers.phoneNumber, pattern),
        );
      })()
    : undefined;

  return db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.shopId, shopId), searchCondition))
    .orderBy(asc(sql`lower(${suppliers.name})`), asc(suppliers.id))
    .limit(opts.limit)
    .offset(opts.offset);
}

/**
 * Finds one supplier by id within a shop.
 * Returns null when the row does not exist or belongs to another shop.
 */
export async function findSupplierRowByIdForShop(
  shopId: string,
  supplierId: string,
): Promise<SupplierRow | null> {
  const [row] = await db
    .select()
    .from(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)))
    .limit(1);
  return row ?? null;
}

/**
 * Finds a supplier in a shop whose name matches ignoring letter case and
 * extra spaces. Used for the duplicate-name warning; not a hard block.
 */
export async function findSupplierRowByNormalizedName(
  shopId: string,
  name: string,
): Promise<SupplierRow | null> {
  const normalized = name.trim().replace(/\s+/g, ' ').toLowerCase();
  const [row] = await db
    .select()
    .from(suppliers)
    .where(
      and(
        eq(suppliers.shopId, shopId),
        sql`lower(regexp_replace(trim(${suppliers.name}), ${'\\s+'}, ' ', 'g')) = ${normalized}`,
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Inserts a supplier row. When `values.id` is supplied and a row with that id
 * already exists (a retried or double-tapped request), no second row is created
 * and the existing row is returned if it belongs to the same shop.
 * Returns null when the id collides with a row from another shop, so no
 * cross-shop data is revealed.
 */
export async function insertSupplierRow(
  values: NewSupplierRow,
): Promise<SupplierRow | null> {
  const [inserted] = await db
    .insert(suppliers)
    .values(values)
    .onConflictDoNothing({ target: suppliers.id })
    .returning();

  if (inserted) return inserted;

  if (!values.id) return null;
  return findSupplierRowByIdForShop(values.shopId, values.id);
}

/**
 * Updates name, phone number and/or notes of a supplier within a shop.
 * Returns the updated row, or null when no matching row exists.
 */
export async function updateSupplierRowForShop(
  shopId: string,
  supplierId: string,
  patch: SupplierRowPatch,
): Promise<SupplierRow | null> {
  const changes: SupplierRowPatch = { ...patch };
  const hasChanges = Object.values(changes).some((v) => v !== undefined);

  if (!hasChanges) {
    return findSupplierRowByIdForShop(shopId, supplierId);
  }

  const [row] = await db
    .update(suppliers)
    .set({ ...changes, updatedAt: new Date() })
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)))
    .returning();

  return row ?? null;
}

/**
 * Deletes a supplier row within a shop and returns the deleted row, or null
 * when no matching row exists. Dependency checks (bills and payments) belong
 * to the service layer, which consults the other modules' public indexes.
 */
export async function deleteSupplierRowForShop(
  shopId: string,
  supplierId: string,
): Promise<SupplierRow | null> {
  const [row] = await db
    .delete(suppliers)
    .where(and(eq(suppliers.id, supplierId), eq(suppliers.shopId, shopId)))
    .returning();

  return row ?? null;
}