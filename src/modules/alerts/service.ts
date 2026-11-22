import { and, asc, desc, eq, gt, inArray, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { alerts, creditTransactions, customers, supplierBills, suppliers, expens } from '@/db/schema';
import { HttpError } from '@/lib/authContext';
import { addDays, daysBetween, formatDate, formatPaise, todayIST } from '@/lib/utils';
import { computeForecast, type ForecastResult } from '@/modules/cash-forecast';
import { computeAvailableCash } from '@/modules/available-cash';
import { classifyRisk } from '@/modules/cash-survival-radar';

type AlertType = (typeof alerts.$inferInsert)['alertType'];
type Category = (typeof alerts.$inferInsert)['filterCategory'];
type SourceType = (typeof alerts.$inferInsert)['sourceRecordType'];

export interface AlertCandidate {
  alertType: AlertType;
  filterCategory: Category;
  /** Transparent tier: lower = more urgent. Order inside a tier is by date, then amount. */
  tier: number;
  amountPaise: number | null;
  dueDate: string | null;
  sourceRecordType: SourceType;
  sourceRecordId: string;
  customerId: string | null;
  title: string;
  party: string | null;
  why_it_matters: string;
  recommended_action: string;
  /** Same text in Hindi; the client shows whichever matches the chosen language. */
  hi: { title: string; why_it_matters: string; recommended_action: string };
}

const CATEGORY_HI: Record<string, string> = {
  rent: 'किराया',
  electricity: 'बिजली',
  wages: 'मज़दूरी',
  transport: 'ढुलाई',
  other: 'अन्य खर्च',
};

const key = (type: string, sourceId: string | null) => `${type}:${sourceId ?? ''}`;

/**
 * Builds the current set of conditions that deserve attention, using fixed rules (spec 6.12):
 * 1 near-term cash shortage, 2 large overdue receivable while a shortage is projected,
 * 3 bills/expenses due soon or overdue, 4 other overdue receivables, 5 data reminders.
 */
export async function computeAlertCandidates(
  shopId: string,
  shared?: { forecast: ForecastResult; cash: Awaited<ReturnType<typeof computeAvailableCash>> },
): Promise<AlertCandidate[]> {
  const today = todayIST();
  const soon = addDays(today, 7);
  const out: AlertCandidate[] = [];

  // Callers that already computed these (the dashboard) pass them in; otherwise load them together.
  const [forecast, cash] = shared ? [shared.forecast, shared.cash] : await Promise.all([computeForecast(shopId, 30), computeAvailableCash(shopId)]);
  const risk = classifyRisk(forecast, cash.shop.cashSafetyThresholdPaise);
  const shortage = risk === 'shortage';
  if (shortage) {
    const gap = Math.max(cash.shop.cashSafetyThresholdPaise, 0) - forecast.lowest_balance_paise;
    out.push({
      alertType: 'projected_cash_shortage',
      filterCategory: 'cash_risk',
      tier: 1,
      amountPaise: gap,
      dueDate: forecast.lowest_balance_date,
      sourceRecordType: 'forecast',
      sourceRecordId: `shortage-${forecast.lowest_balance_date}`,
      customerId: null,
      title: 'Cash may run short',
      party: null,
      why_it_matters: `Projected cash falls to ${formatPaise(forecast.lowest_balance_paise)} on ${formatDate(forecast.lowest_balance_date)}.`,
      recommended_action: 'Follow up on overdue customer payments and check what is due around that date.',
      hi: {
        title: 'नकदी कम पड़ सकती है',
        why_it_matters: `अनुमान है कि ${formatDate(forecast.lowest_balance_date)} तक नकदी घटकर ${formatPaise(forecast.lowest_balance_paise)} रह जाएगी।`,
        recommended_action: 'देर से चल रहे ग्राहकों से भुगतान माँगें और उस तारीख के आसपास देय भुगतान जाँचें।',
      },
    });
  }

  const [credits, bills, unpaid] = await Promise.all([
    db
      .select({ tx: creditTransactions, name: customers.name })
      .from(creditTransactions)
      .innerJoin(customers, eq(customers.id, creditTransactions.customerId))
      .where(and(eq(creditTransactions.shopId, shopId), gt(creditTransactions.remainingAmountPaise, 0))),
    db
      .select({ bill: supplierBills, name: suppliers.name })
      .from(supplierBills)
      .innerJoin(suppliers, eq(suppliers.id, supplierBills.supplierId))
      .where(and(eq(supplierBills.shopId, shopId), gt(supplierBills.remainingAmountPaise, 0))),
    db
      .select()
      .from(expens)
      .where(and(eq(expens.shopId, shopId), eq(expens.status, 'unpaid'))),
  ]);

  let undated = 0;
  for (const { tx, name } of credits) {
    if (!tx.expectedPaymentDate) {
      undated += 1;
      continue;
    }
    if (tx.expectedPaymentDate >= today) continue;
    const lateDays = daysBetween(tx.expectedPaymentDate, today);
    const severe = lateDays > 7;
    out.push({
      alertType: severe ? 'customer_payment_overdue' : 'customer_expected_payment_not_received',
      filterCategory: 'collections',
      tier: shortage ? 2 : 4,
      amountPaise: tx.remainingAmountPaise,
      dueDate: tx.expectedPaymentDate,
      sourceRecordType: 'credit_transaction',
      sourceRecordId: tx.id,
      customerId: tx.customerId,
      title: severe ? `${name}'s payment is overdue` : `${name}'s expected payment has not arrived`,
      party: name,
      why_it_matters: `${formatPaise(tx.remainingAmountPaise)} was expected ${lateDays} day${lateDays === 1 ? '' : 's'} ago.`,
      recommended_action: 'Send a polite reminder and note when they promise to pay.',
      hi: {
        title: severe ? `${name} का भुगतान देर से है` : `${name} का अपेक्षित भुगतान अभी नहीं आया`,
        why_it_matters: `${formatPaise(tx.remainingAmountPaise)} ${lateDays} दिन पहले आने थे।`,
        recommended_action: 'विनम्र संदेश भेजें और पूछें कि वे कब तक भुगतान करेंगे।',
      },
    });
  }

  for (const { bill, name } of bills) {
    if (bill.dueDate > soon) continue;
    const overdue = bill.dueDate < today;
    out.push({
      alertType: overdue ? 'supplier_bill_overdue' : 'supplier_bill_due_soon',
      filterCategory: 'supplier',
      tier: 3,
      amountPaise: bill.remainingAmountPaise,
      dueDate: bill.dueDate,
      sourceRecordType: 'supplier_bill',
      sourceRecordId: bill.id,
      customerId: null,
      title: overdue ? `Bill from ${name} is overdue` : `Bill from ${name} is due soon`,
      party: name,
      why_it_matters: overdue
        ? `${formatPaise(bill.remainingAmountPaise)} was due ${daysBetween(bill.dueDate, today)} day(s) ago.`
        : `${formatPaise(bill.remainingAmountPaise)} is due on ${formatDate(bill.dueDate)}.`,
      recommended_action: 'Check the amount and due date, then plan the payment or talk to the supplier.',
      hi: {
        title: overdue ? `${name} का बिल देर से है` : `${name} का बिल जल्द देय है`,
        why_it_matters: overdue
          ? `${formatPaise(bill.remainingAmountPaise)} ${daysBetween(bill.dueDate, today)} दिन पहले देने थे।`
          : `${formatPaise(bill.remainingAmountPaise)} ${formatDate(bill.dueDate)} तक देना है।`,
        recommended_action: 'रकम और तारीख जाँचें, फिर भुगतान की योजना बनाएँ या सप्लायर से बात करें।',
      },
    });
  }

  for (const e of unpaid) {
    if (!e.dueDate || e.dueDate > soon) continue;
    out.push({
      alertType: 'expense_due_soon',
      filterCategory: 'expenses',
      tier: 3,
      amountPaise: e.amountPaise,
      dueDate: e.dueDate,
      sourceRecordType: 'expense',
      sourceRecordId: e.id,
      customerId: null,
      title: `${e.description || e.category} is due ${e.dueDate < today ? 'now' : 'soon'}`,
      party: null,
      why_it_matters: `${formatPaise(e.amountPaise)} is due on ${formatDate(e.dueDate)}.`,
      recommended_action: 'Mark it paid when done, or review if it can wait.',
      hi: {
        title: `${e.description || CATEGORY_HI[e.category] || e.category} ${e.dueDate < today ? 'अभी' : 'जल्द'} देय है`,
        why_it_matters: `${formatPaise(e.amountPaise)} ${formatDate(e.dueDate)} तक देना है।`,
        recommended_action: 'चुकाने के बाद "चुकाया" दर्ज करें, या देखें कि क्या यह रुक सकता है।',
      },
    });
  }

  if (undated > 0) {
    out.push({
      alertType: 'forecast_data_incomplete',
      filterCategory: 'cash_risk',
      tier: 5,
      amountPaise: null,
      dueDate: null,
      sourceRecordType: 'forecast',
      sourceRecordId: 'forecast',
      customerId: null,
      title: 'Forecast is missing some dates',
      party: null,
      why_it_matters: `${undated} credit sale${undated === 1 ? ' has' : 's have'} no expected payment date, so the forecast ignores ${undated === 1 ? 'it' : 'them'}.`,
      recommended_action: 'Add an expected payment date to each open credit sale.',
      hi: {
        title: 'अनुमान में कुछ तारीखें नहीं हैं',
        why_it_matters: `${undated} उधार की अनुमानित भुगतान तारीख नहीं है, इसलिए अनुमान उन्हें नहीं गिनता।`,
        recommended_action: 'हर बाकी उधार में अनुमानित भुगतान तारीख जोड़ें।',
      },
    });
  }

  out.sort(
    (a, b) =>
      a.tier - b.tier ||
      (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
      (b.amountPaise ?? 0) - (a.amountPaise ?? 0),
  );
  return out;
}

/**
 * Makes the stored alerts match reality: new conditions get an alert, changed ones are
 * refreshed (keeping their review state), and conditions that no longer exist are resolved.
 * Only the alerts table is written; financial records are never touched.
 */
export async function syncAlertRecords(shopId: string) {
  // The two reads are independent.
  const [candidates, open] = await Promise.all([
    computeAlertCandidates(shopId),
    db
      .select()
      .from(alerts)
      .where(and(eq(alerts.shopId, shopId), ne(alerts.status, 'resolved'))),
  ]);
  const openByKey = new Map(open.map((a) => [key(a.alertType, a.sourceRecordId), a]));
  const seen = new Set<string>();
  const inserts: (typeof alerts.$inferInsert)[] = [];
  const updates: { id: string; priorityRank: number; amountPaise: number | null; dueDate: string | null }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const k = key(c.alertType, c.sourceRecordId);
    seen.add(k);
    const existing = openByKey.get(k);
    if (existing) {
      // Only write when something actually changed: this runs every time the Action Centre is opened.
      if (existing.priorityRank !== i + 1 || existing.amountPaise !== c.amountPaise || existing.dueDate !== c.dueDate) {
        updates.push({ id: existing.id, priorityRank: i + 1, amountPaise: c.amountPaise, dueDate: c.dueDate });
      }
    } else {
      inserts.push({
        shopId,
        alertType: c.alertType,
        filterCategory: c.filterCategory,
        priorityRank: i + 1,
        amountPaise: c.amountPaise,
        dueDate: c.dueDate,
        sourceRecordType: c.sourceRecordType,
        sourceRecordId: c.sourceRecordId,
        customerId: c.customerId,
      });
    }
  }

  const stale = open.filter((a) => !seen.has(key(a.alertType, a.sourceRecordId))).map((a) => a.id);
  await Promise.all([
    inserts.length ? db.insert(alerts).values(inserts) : null,
    ...updates.map((u) => db.update(alerts).set({ priorityRank: u.priorityRank, amountPaise: u.amountPaise, dueDate: u.dueDate }).where(eq(alerts.id, u.id))),
    stale.length ? db.update(alerts).set({ status: 'resolved', resolvedAt: new Date() }).where(inArray(alerts.id, stale)) : null,
  ]);
  return { created: inserts.length, updated: updates.length, resolved: stale.length, candidates };
}

function fallbackText(alert: typeof alerts.$inferSelect) {
  const label = alert.alertType.replace(/_/g, ' ');
  return {
    title: label.charAt(0).toUpperCase() + label.slice(1),
    party: null as string | null,
    why_it_matters: alert.status === 'resolved' ? 'This is no longer a problem.' : '',
    recommended_action: '',
    hi: { title: label, why_it_matters: alert.status === 'resolved' ? 'अब यह समस्या नहीं है।' : '', recommended_action: '' },
  };
}

function enrich(alert: typeof alerts.$inferSelect, byKey: Map<string, AlertCandidate>) {
  const c = byKey.get(key(alert.alertType, alert.sourceRecordId));
  const text = c
    ? { title: c.title, party: c.party, why_it_matters: c.why_it_matters, recommended_action: c.recommended_action, hi: c.hi }
    : fallbackText(alert);
  return { ...alert, ...text };
}

export async function listAlertRecords(
  shopId: string,
  query: { filter_category?: Category; status?: 'new' | 'reviewed' | 'action_taken' | 'resolved'; limit?: number; cursor?: string },
) {
  const { candidates } = await syncAlertRecords(shopId);
  const byKey = new Map(candidates.map((c) => [key(c.alertType, c.sourceRecordId), c]));
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
  const offset = query.cursor ? Math.max(parseInt(query.cursor, 10) || 0, 0) : 0;
  const conds = [eq(alerts.shopId, shopId)];
  if (query.filter_category) conds.push(eq(alerts.filterCategory, query.filter_category));
  if (query.status) conds.push(eq(alerts.status, query.status));
  else conds.push(ne(alerts.status, 'resolved'));
  const rows = await db
    .select()
    .from(alerts)
    .where(and(...conds))
    .orderBy(asc(alerts.priorityRank), desc(alerts.createdAt))
    .limit(limit + 1)
    .offset(offset);
  return {
    items: rows.slice(0, limit).map((a) => enrich(a, byKey)),
    next_cursor: rows.length > limit ? String(offset + limit) : null,
  };
}

async function findAlert(shopId: string, id: string) {
  const [row] = await db
    .select()
    .from(alerts)
    .where(and(eq(alerts.shopId, shopId), eq(alerts.id, id)))
    .limit(1);
  if (!row) throw new HttpError(404, 'Alert not found');
  return row;
}

export async function getAlertRecord(shopId: string, id: string) {
  const alert = await findAlert(shopId, id);
  const candidates = await computeAlertCandidates(shopId);
  return enrich(alert, new Map(candidates.map((c) => [key(c.alertType, c.sourceRecordId), c])));
}

export async function reviewAlertRecord(session: { userId: string; shopId: string }, id: string) {
  const alert = await findAlert(session.shopId, id);
  if (alert.status === 'resolved') throw new HttpError(409, 'This alert is already resolved');
  if (alert.status === 'new') {
    await db.update(alerts).set({ status: 'reviewed', reviewedByUserId: session.userId, reviewedAt: new Date() }).where(eq(alerts.id, id));
  }
  return getAlertRecord(session.shopId, id);
}

export async function takeActionOnAlert(session: { userId: string; shopId: string }, id: string, input: { action_note?: string }) {
  const alert = await findAlert(session.shopId, id);
  if (alert.status === 'resolved') throw new HttpError(409, 'This alert is already resolved');
  await db
    .update(alerts)
    .set({
      status: 'action_taken',
      actionTakenAt: new Date(),
      actionNote: input.action_note?.trim() || null,
      reviewedByUserId: alert.reviewedByUserId ?? session.userId,
      reviewedAt: alert.reviewedAt ?? new Date(),
    })
    .where(eq(alerts.id, id));
  return getAlertRecord(session.shopId, id);
}

export async function countOpenAlerts(shopId: string): Promise<number> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(alerts)
    .where(and(eq(alerts.shopId, shopId), ne(alerts.status, 'resolved')));
  return n;
}
