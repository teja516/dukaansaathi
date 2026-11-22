import { and, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { shops, auditEvents } from '@/db/schema';

export type ShopRow = typeof shops.$inferSelect;
export type ShopInsert = typeof shops.$inferInsert;
export type AuditEventRow = typeof auditEvents.$inferSelect;
export type AuditEventInsert = typeof auditEvents.$inferInsert;

type ShopCreateInput = Omit<ShopInsert, 'id' | 'createdAt' | 'updatedAt'>;
type ShopUpdateInput = Partial<Omit<ShopInsert, 'id' | 'createdAt' | 'updatedAt'>>;
type AuditEventCreateInput = Omit<AuditEventInsert, 'id' | 'createdAt' | 'updatedAt'>;
type AuditEventUpdateInput = Partial<Omit<AuditEventInsert, 'id' | 'createdAt' | 'updatedAt'>>;

export interface ListShopsOptions {
  limit?: number;
  offset?: number;
}

export interface ListAuditEventsOptions {
  shopId?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function clampLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), MAX_LIMIT);
}

function clampOffset(offset: number | undefined): number {
  if (typeof offset !== 'number' || !Number.isFinite(offset) || offset < 0) {
    return 0;
  }
  return Math.floor(offset);
}

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export async function listShops(options: ListShopsOptions = {}): Promise<ShopRow[]> {
  return db
    .select()
    .from(shops)
    .orderBy(desc(shops.createdAt))
    .limit(clampLimit(options.limit))
    .offset(clampOffset(options.offset));
}

export async function getShopById(id: string): Promise<ShopRow | null> {
  const rows = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createShop(input: ShopCreateInput): Promise<ShopRow> {
  const rows = await db.insert(shops).values(input).returning();
  return rows[0];
}

export async function updateShop(id: string, input: ShopUpdateInput): Promise<ShopRow | null> {
  const rows = await db
    .update(shops)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(shops.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteShop(id: string): Promise<boolean> {
  const rows = await db.delete(shops).where(eq(shops.id, id)).returning({ id: shops.id });
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Audit events
// ---------------------------------------------------------------------------

export async function listAuditEvents(
  options: ListAuditEventsOptions = {},
): Promise<AuditEventRow[]> {
  const conditions: SQL[] = [];

  if (options.shopId) {
    conditions.push(eq(auditEvents.shopId, options.shopId));
  }
  if (options.entityType) {
    conditions.push(eq(auditEvents.entityType, options.entityType));
  }
  if (options.entityId) {
    conditions.push(eq(auditEvents.entityId, options.entityId));
  }

  const query = db.select().from(auditEvents);
  const filtered = conditions.length > 0 ? query.where(and(...conditions)) : query;

  return filtered
    .orderBy(desc(auditEvents.createdAt))
    .limit(clampLimit(options.limit))
    .offset(clampOffset(options.offset));
}

export async function getAuditEventById(id: string): Promise<AuditEventRow | null> {
  const rows = await db.select().from(auditEvents).where(eq(auditEvents.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createAuditEvent(input: AuditEventCreateInput): Promise<AuditEventRow> {
  const rows = await db.insert(auditEvents).values(input).returning();
  return rows[0];
}

export async function updateAuditEvent(
  id: string,
  input: AuditEventUpdateInput,
): Promise<AuditEventRow | null> {
  const rows = await db
    .update(auditEvents)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(auditEvents.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteAuditEvent(id: string): Promise<boolean> {
  const rows = await db
    .delete(auditEvents)
    .where(eq(auditEvents.id, id))
    .returning({ id: auditEvents.id });
  return rows.length > 0;
}