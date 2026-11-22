import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { creditTransactions, customers, supplierBills, suppliers, expens } from '@/db/schema';
import { formatPaise, todayIST } from '@/lib/utils';
import { computeAvailableCash } from '@/modules/available-cash';
import { buildLedger, type ExcludedCollection, type LedgerDay, type LedgerEvent } from './ledger';

export type { LedgerEvent, ExcludedCollection } from './ledger';
export type LedgerEventKind = LedgerEvent['kind'];

export interface ForecastResult {
  period_days: number;
  starting_available_paise: number;
  lowest_balance_paise: number;
  lowest_balance_date: string;
  ending_balance_paise: number;
  expected_collections_count: number;
  scheduled_obligations_count: number;
  expected_inflows_paise: number;
  scheduled_outflows_paise: number;
  overdue_excluded_paise: number;
  days: LedgerDay[];
  events: LedgerEvent[];
  excluded: ExcludedCollection[];
  assumptions: string[];
  calculated_at: string;
}

export interface ForecastOptions {
  /** What-if only: move this one expected collection later by delayDays. Never persisted. */
  delayCreditTransactionId?: string;
  delayDays?: number;
  /** Pass today's available cash if the caller already has it; saves one database round trip. */
  availablePaise?: number;
}

/**
 * Loads the shop's open records and runs the pure ledger (see ./ledger.ts for the rules).
 * Read-only: nothing here writes to the database. No AI is involved in any number.
 */
export async function computeForecast(shopId: string, periodDays: number, opts: ForecastOptions = {}): Promise<ForecastResult> {
  const today = todayIST();
  const available_paise = opts.availablePaise ?? (await computeAvailableCash(shopId)).available_paise;

  // The three reads are independent, so run them together instead of one after another.
  const [credits, bills, expenses] = await Promise.all([
    db
      .select({ tx: creditTransactions, customerName: customers.name })
      .from(creditTransactions)
      .innerJoin(customers, eq(customers.id, creditTransactions.customerId))
      .where(and(eq(creditTransactions.shopId, shopId), gt(creditTransactions.remainingAmountPaise, 0))),
    db
      .select({ bill: supplierBills, supplierName: suppliers.name })
      .from(supplierBills)
      .innerJoin(suppliers, eq(suppliers.id, supplierBills.supplierId))
      .where(and(eq(supplierBills.shopId, shopId), gt(supplierBills.remainingAmountPaise, 0))),
    db
      .select()
      .from(expens)
      .where(and(eq(expens.shopId, shopId), eq(expens.status, 'unpaid'))),
  ]);

  const r = buildLedger({
    today,
    periodDays,
    startingCashPaise: available_paise,
    credits: credits.map(({ tx, customerName }) => ({ id: tx.id, label: customerName, remainingPaise: tx.remainingAmountPaise, expectedDate: tx.expectedPaymentDate })),
    bills: bills.map(({ bill, supplierName }) => ({ id: bill.id, label: supplierName, remainingPaise: bill.remainingAmountPaise, dueDate: bill.dueDate })),
    expenses: expenses.map((e) => ({ id: e.id, label: e.description || e.category, amountPaise: e.amountPaise, dueDate: e.dueDate })),
    delay: opts.delayCreditTransactionId ? { creditId: opts.delayCreditTransactionId, days: opts.delayDays ?? 0 } : undefined,
  });

  const assumptions = [
    `Starting from available cash of ${formatPaise(available_paise)} (opening balances + money actually received − money actually paid).`,
    'Customer payments are counted only on their expected date. An expected date is not a promise to pay.',
    r.overdueExcludedPaise > 0
      ? `${formatPaise(r.overdueExcludedPaise)} of customer payments are past their expected date and are excluded from this forecast.`
      : 'No customer payments are past their expected date.',
    r.undatedPaise > 0
      ? `${formatPaise(r.undatedPaise)} of credit has no expected payment date and is excluded.`
      : 'Every open credit sale has an expected payment date.',
    'Supplier bills and unpaid expenses are counted on their due date.',
    r.overdueObligationsPaise > 0
      ? `${formatPaise(r.overdueObligationsPaise)} of bills and expenses are already overdue and are counted as payable today.`
      : 'No bills or expenses are overdue.',
  ];
  if (opts.delayCreditTransactionId) {
    assumptions.push(`What-if: one expected collection is moved ${opts.delayDays ?? 0} days later. Your real records are unchanged.`);
  }

  return {
    period_days: periodDays,
    starting_available_paise: available_paise,
    lowest_balance_paise: r.lowestBalancePaise,
    lowest_balance_date: r.lowestBalanceDate,
    ending_balance_paise: r.endingBalancePaise,
    expected_collections_count: r.events.filter((e) => e.kind === 'expected_collection').length,
    scheduled_obligations_count: r.events.filter((e) => e.kind !== 'expected_collection').length,
    expected_inflows_paise: r.expectedInflowsPaise,
    scheduled_outflows_paise: r.scheduledOutflowsPaise,
    overdue_excluded_paise: r.overdueExcludedPaise,
    days: r.days,
    events: r.events,
    excluded: r.excluded,
    assumptions,
    calculated_at: new Date().toISOString(),
  };
}

export function parsePeriod(v: string | undefined): 30 | 60 | 90 {
  return v === '60' ? 60 : v === '90' ? 90 : 30;
}
