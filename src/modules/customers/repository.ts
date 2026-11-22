
import { and, asc, desc, eq, ilike, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { customers } from '@/db/schema';

export type CustomerRow = typeof customers.$inferSelect;
export type NewCustomerRow = typeof customers.$inferInsert;

export type CustomerSort = 'name' | 'newest';

export interface ListCustomersOptions {
  search?: string;
  sort?: CustomerSort;
}

export interface CustomerFieldsPatch {
  name?: string;
  phoneNumber?: string | null;
  notes?: string | null;
}

/** Escapes LIKE/ILIKE wildcards so user text is matched literally. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Lists customers belonging to one shop, optionally filtered by a partial, case-insensitive name match. */
export async function listCustomersByShop(
  shopId: string,
  options: ListCustomersOptions = {},
): Promise<CustomerRow[]> {
  const conditions = [eq(customers.shopId, shopId)];

  const search = options.search?.trim();
  if (search) {
    conditions.push(ilike(customers.name, `%${escapeLike(search)}%`));
  }

  const orderBy =
    options.sort === 'name'
      ? [asc(sql`lower(${customers.name})`), asc(customers.id)]
      : [desc(customers.createdAt), asc(customers.id)];

  return db
    .select()
    .from(customers)
    .where(and(...conditions))
    .orderBy(...orderBy);
}

/** Returns the customer only if it belongs to the given shop; otherwise null. */
export async function findCustomerByIdInShop(
  shopId: string,
  customerId: string,
): Promise<CustomerRow | null> {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, customerId), eq(customers.shopId, shopId)))
    .limit(1);

  return rows[0] ?? null;
}

/** Finds an existing customer in the shop with the same phone number, used for duplicate warnings. */
export async function findCustomerByPhoneInShop(
  shopId: string,
  phoneNumber: string,
): Promise<CustomerRow | null> {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.shopId, shopId), eq(customers.phoneNumber, phoneNumber)))
    .limit(1);

  return rows[0] ?? null;
}

/** Inserts a customer row. The shopId must come from the authenticated session, never from the form. */
export async function insertCustomer(values: NewCustomerRow): Promise<CustomerRow> {
  const rows = await db.insert(customers).values(values).returning();
  return rows[0];
}

/** Updates identity fields of a customer within a shop; returns null when no such row exists in that shop. */
export async function updateCustomerInShop(
  shopId: string,
  customerId: string,
  patch: CustomerFieldsPatch,
): Promise<CustomerRow | null> {
  const set: Partial<NewCustomerRow> = { updatedAt: new Date() };

  if (patch.name !== undefined) set.name = patch.name;
  if (patch.phoneNumber !== undefined) set.phoneNumber = patch.phoneNumber;
  if (patch.notes !== undefined) set.notes = patch.notes;

  const rows = await db
    .update(customers)
    .set(set)
    .where(and(eq(customers.id, customerId), eq(customers.shopId, shopId)))
    .returning();

  return rows[0] ?? null;
}

/** Deletes a customer row within a shop; returns false when no such row exists. Financial-history checks belong to the service. */
export async function deleteCustomerInShop(shopId: string, customerId: string): Promise<boolean> {
  const rows = await db
    .delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.shopId, shopId)))
    .returning({ id: customers.id });

  return rows.length > 0;
}