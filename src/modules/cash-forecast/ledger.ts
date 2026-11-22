/**
 * Pure cash-flow ledger: no database, no clock, no I/O. Everything the forecast, the Cash Survival
 * Radar and the what-if simulator calculate comes from this one function (spec 5.4: one business-logic
 * source for each metric), which is what makes the financial rules unit-testable.
 *
 * Rules (spec 6.9, 9.4, 21.3, 21.5):
 *  - Start from today's actual available cash.
 *  - Expected customer collections count on their expected date, today or later, inside the period.
 *  - Collections that are overdue (expected date already passed) or have no date are EXCLUDED, and listed.
 *  - Unpaid supplier bills and unpaid expenses count on their due date.
 *    Ones already overdue are still owed, so they are counted today and flagged.
 *  - Closing balance of each day = previous closing + inflows - outflows.
 *  - The what-if "delay" moves exactly one collection later, in memory only.
 */

export type LedgerEventKind = 'expected_collection' | 'supplier_bill_due' | 'expense_due';

export interface LedgerEvent {
  date: string;
  kind: LedgerEventKind;
  label: string;
  amount_paise: number;
  source_type: string;
  source_id: string;
  /** Obligation that was already past due; it is counted today instead of on its real date. */
  overdue?: boolean;
  original_date?: string;
}

/** A customer payment the forecast leaves out, so the owner can see who and why. */
export interface ExcludedCollection {
  customer_name: string;
  amount_paise: number;
  expected_payment_date: string | null;
  reason: 'overdue' | 'no_date';
  source_id: string;
}

export interface LedgerInput {
  /** Today's date in IST (YYYY-MM-DD). Passed in so the function stays deterministic. */
  today: string;
  periodDays: number;
  startingCashPaise: number;
  credits: { id: string; label: string; remainingPaise: number; expectedDate: string | null }[];
  bills: { id: string; label: string; remainingPaise: number; dueDate: string }[];
  expenses: { id: string; label: string; amountPaise: number; dueDate: string | null }[];
  /** What-if only: move this one expected collection later by `days`. */
  delay?: { creditId: string; days: number };
}

export interface LedgerDay {
  date: string;
  inflow_paise: number;
  outflow_paise: number;
  closing_balance_paise: number;
}

export interface LedgerResult {
  events: LedgerEvent[];
  excluded: ExcludedCollection[];
  days: LedgerDay[];
  lowestBalancePaise: number;
  lowestBalanceDate: string;
  endingBalancePaise: number;
  expectedInflowsPaise: number;
  scheduledOutflowsPaise: number;
  /** Overdue collections left out. */
  overdueExcludedPaise: number;
  /** Collections with no expected date, left out. */
  undatedPaise: number;
  /** Bills/expenses already overdue and counted today. */
  overdueObligationsPaise: number;
}

export function addDaysTo(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * 86_400_000).toISOString().slice(0, 10);
}

export function buildLedger(input: LedgerInput): LedgerResult {
  const { today, periodDays } = input;
  const end = addDaysTo(today, periodDays);
  const events: LedgerEvent[] = [];
  const excluded: ExcludedCollection[] = [];
  let overdueExcluded = 0;
  let undated = 0;
  let overdueObligations = 0;

  for (const c of input.credits) {
    if (c.remainingPaise <= 0) continue;
    if (!c.expectedDate) {
      undated += c.remainingPaise;
      excluded.push({ customer_name: c.label, amount_paise: c.remainingPaise, expected_payment_date: null, reason: 'no_date', source_id: c.id });
      continue;
    }
    let date = c.expectedDate;
    if (input.delay && input.delay.creditId === c.id && input.delay.days) date = addDaysTo(date, input.delay.days);
    if (date < today) {
      overdueExcluded += c.remainingPaise;
      excluded.push({ customer_name: c.label, amount_paise: c.remainingPaise, expected_payment_date: date, reason: 'overdue', source_id: c.id });
      continue;
    }
    if (date > end) continue;
    events.push({ date, kind: 'expected_collection', label: c.label, amount_paise: c.remainingPaise, source_type: 'credit_transaction', source_id: c.id });
  }

  for (const b of input.bills) {
    if (b.remainingPaise <= 0) continue;
    let date = b.dueDate;
    const late = date < today;
    if (late) {
      overdueObligations += b.remainingPaise;
      date = today;
    }
    if (date > end) continue;
    events.push({
      date,
      kind: 'supplier_bill_due',
      label: b.label,
      amount_paise: b.remainingPaise,
      source_type: 'supplier_bill',
      source_id: b.id,
      ...(late ? { overdue: true, original_date: b.dueDate } : {}),
    });
  }

  for (const e of input.expenses) {
    if (!e.dueDate) continue;
    let date = e.dueDate;
    const late = date < today;
    if (late) {
      overdueObligations += e.amountPaise;
      date = today;
    }
    if (date > end) continue;
    events.push({
      date,
      kind: 'expense_due',
      label: e.label,
      amount_paise: e.amountPaise,
      source_type: 'expense',
      source_id: e.id,
      ...(late ? { overdue: true, original_date: e.dueDate } : {}),
    });
  }

  events.sort((a, b) => a.date.localeCompare(b.date) || b.amount_paise - a.amount_paise);

  const inflowByDate = new Map<string, number>();
  const outflowByDate = new Map<string, number>();
  for (const ev of events) {
    const map = ev.kind === 'expected_collection' ? inflowByDate : outflowByDate;
    map.set(ev.date, (map.get(ev.date) ?? 0) + ev.amount_paise);
  }

  const days: LedgerDay[] = [];
  let balance = input.startingCashPaise;
  let lowest = Number.POSITIVE_INFINITY;
  let lowestDate = today;
  for (let i = 0; i <= periodDays; i++) {
    const date = addDaysTo(today, i);
    const inflow = inflowByDate.get(date) ?? 0;
    const outflow = outflowByDate.get(date) ?? 0;
    balance += inflow - outflow;
    days.push({ date, inflow_paise: inflow, outflow_paise: outflow, closing_balance_paise: balance });
    // Strictly lower only: the FIRST day the minimum is reached is the one reported.
    if (balance < lowest) {
      lowest = balance;
      lowestDate = date;
    }
  }

  return {
    events,
    excluded,
    days,
    lowestBalancePaise: lowest,
    lowestBalanceDate: lowestDate,
    endingBalancePaise: balance,
    expectedInflowsPaise: events.filter((e) => e.kind === 'expected_collection').reduce((s, e) => s + e.amount_paise, 0),
    scheduledOutflowsPaise: events.filter((e) => e.kind !== 'expected_collection').reduce((s, e) => s + e.amount_paise, 0),
    overdueExcludedPaise: overdueExcluded,
    undatedPaise: undated,
    overdueObligationsPaise: overdueObligations,
  };
}
