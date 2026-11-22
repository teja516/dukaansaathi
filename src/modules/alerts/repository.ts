import { and, asc, desc, eq, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { alerts } from '@/db/schema';

export type AlertRow = typeof alerts.$inferSelect;
export type AlertInsert = typeof alerts.$inferInsert;
export type AlertFilterCategory = AlertRow['filterCategory'];
export type AlertStatus = AlertRow['status'];

export interface ListAlertsFilter {
  shopId: string;
  filterCategory?: AlertFilterCategory;
  status?: AlertStatus;
}

export type AlertPatch = Partial<Omit<AlertInsert, 'id' | 'createdAt'>>;

/**
 * Lists alerts for a shop, ordered by priority rank (most urgent first),
 * then newest first within the same rank.
 */
export async function listAlerts(filter: ListAlertsFilter): Promise<AlertRow[]> {
  const conditions: SQL[] = [eq(alerts.shopId, filter.shopId)];

  if (filter.filterCategory) {
    conditions.push(eq(alerts.filterCategory, filter.filterCategory));
  }
  if (filter.status) {
    conditions.push(eq(alerts.status, filter.status));
  }

  return db
    .select()
    .from(alerts)
    .where(and(...conditions))
    .orderBy(asc(alerts.priorityRank), desc(alerts.createdAt));
}

/**
 * Returns one alert by id, or null when no row matches.
 * When shopId is given, the alert must belong to that shop.
 */
export async function getAlertById(alertId: string, shopId?: string): Promise<AlertRow | null> {
  const conditions: SQL[] = [eq(alerts.id, alertId)];
  if (shopId) {
    conditions.push(eq(alerts.shopId, shopId));
  }

  const rows = await db
    .select()
    .from(alerts)
    .where(and(...conditions))
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Inserts a new alert and returns the created row.
 */
export async function createAlert(input: AlertInsert): Promise<AlertRow> {
  const [row] = await db.insert(alerts).values(input).returning();
  if (!row) {
    throw new Error('Failed to insert alert');
  }
  return row;
}

/**
 * Updates an alert and returns the updated row, or null when no row matches.
 * Stamps updatedAt on every write.
 */
export async function updateAlert(
  alertId: string,
  patch: AlertPatch,
  shopId?: string,
): Promise<AlertRow | null> {
  const conditions: SQL[] = [eq(alerts.id, alertId)];
  if (shopId) {
    conditions.push(eq(alerts.shopId, shopId));
  }

  const [row] = await db
    .update(alerts)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(...conditions))
    .returning();

  return row ?? null;
}

/**
 * Deletes an alert. Returns true when a row was removed, false when no row matched.
 */
export async function deleteAlert(alertId: string, shopId?: string): Promise<boolean> {
  const conditions: SQL[] = [eq(alerts.id, alertId)];
  if (shopId) {
    conditions.push(eq(alerts.shopId, shopId));
  }

  const rows = await db
    .delete(alerts)
    .where(and(...conditions))
    .returning({ id: alerts.id });

  return rows.length > 0;
}