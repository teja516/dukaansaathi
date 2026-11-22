/**
 * Cash forecast module types.
 *
 * Wire-level shapes for GET /api/cash-forecast. Amounts are integer paise
 * and dates are IST calendar dates in YYYY-MM-DD form, because JSON carries
 * numbers and strings, not Prisma/Drizzle Date or Decimal values.
 *
 * This module owns no tables. Its figures are computed from other modules'
 * data, so there are no model re-exports here.
 */

/** Allowed forecast windows, as sent in the `period` query parameter. */
export type ForecastPeriod = '30' | '60' | '90';

/** The same windows as numbers, as returned in responses. */
export type ForecastPeriodDays = 30 | 60 | 90;

export interface CashForecastQuery {
  period?: ForecastPeriod;
}

/** How certain a projected item is. Projections are never guaranteed. */
export type ForecastCertainty = 'expected' | 'scheduled';

export type ForecastEventKind = 'collection' | 'supplier_bill' | 'expense';

export type ForecastEventDirection = 'inflow' | 'outflow';

/** A single dated projected item that moves the balance on its date. */
export interface ForecastEvent {
  id: string;
  kind: ForecastEventKind;
  direction: ForecastEventDirection;
  /** IST calendar date, YYYY-MM-DD. */
  date: string;
  label: string;
  /** Source reference, e.g. a bill or credit ref such as "UDH-2041". */
  reference: string | null;
  counterparty: string | null;
  /** Remaining unpaid amount in paise. Always positive; direction gives the sign. */
  amount_paise: number;
  certainty: ForecastCertainty;
  /** Source record id so the UI can link to it. */
  source_id: string;
}

/** One row of the day-by-day ledger. */
export interface ForecastDay {
  /** IST calendar date, YYYY-MM-DD. */
  date: string;
  inflow_paise: number;
  outflow_paise: number;
  /** Carries forward to the next day's opening balance. */
  closing_balance_paise: number;
}

/** Customer credit whose expected date has passed and is still unpaid. */
export interface OverdueCollection {
  credit_transaction_id: string;
  customer_id: string;
  customer_name: string;
  /** The expected date that has passed, YYYY-MM-DD. */
  expected_date: string;
  days_overdue: number;
  outstanding_paise: number;
}

/** Customer credit with an unpaid balance but no expected payment date. */
export interface NoDateCollection {
  credit_transaction_id: string;
  customer_id: string;
  customer_name: string;
  outstanding_paise: number;
}

export interface ForecastLowestPoint {
  balance_paise: number;
  /** IST calendar date, YYYY-MM-DD. */
  date: string;
}

export type ForecastThresholdSource = 'system_default' | 'owner_set';

export interface ForecastThreshold {
  /** Cash safety threshold in paise. Defaults to 0. */
  amount_paise: number;
  source: ForecastThresholdSource;
}

export interface ForecastShortfall {
  flagged: boolean;
  /** How far the lowest balance is below the threshold, in paise. 0 when not flagged. */
  amount_paise: number;
  /** IST calendar date of the lowest balance, YYYY-MM-DD. */
  date: string;
}

export interface ForecastTotals {
  /** Opening balances plus actual receipts minus actual payments, in paise. */
  actual_available_paise: number;
  /** Sum of expected customer collections inside the window. */
  expected_collections_paise: number;
  /** Sum of unpaid supplier bills due inside the window. */
  scheduled_supplier_payments_paise: number;
  /** Sum of unpaid expenses due inside the window. */
  scheduled_expense_payments_paise: number;
  /** Overdue credit, excluded from the base case and shown separately. */
  overdue_collections_paise: number;
  /** Credit with no expected date, excluded from inflows. */
  no_date_collections_paise: number;
  /** Closing balance on the last day of the window. */
  projected_end_balance_paise: number;
}

export interface ForecastAssumptions {
  timezone: 'Asia/Kolkata';
  /** Projection starts from actual available cash. Expected amounts are added on top. */
  starting_point: string;
  /** Overdue credit is excluded until a revised expected date is recorded. */
  overdue_treatment: string;
  /** Credit with no expected date is excluded from inflows. */
  no_date_treatment: string;
  /** Each amount appears once, as actual, expected or scheduled. */
  counting_rule: string;
  /** Always true. Every figure is an estimate built from entered dates. */
  is_estimate: true;
}

/** Response body for GET /api/cash-forecast. */
export interface CashForecast {
  period_days: ForecastPeriodDays;
  /** Today's IST date, YYYY-MM-DD. The window starts here. */
  start_date: string;
  /** Last day of the window, YYYY-MM-DD. */
  end_date: string;
  starting_balance_paise: number;
  lowest_balance: ForecastLowestPoint;
  threshold: ForecastThreshold;
  shortfall: ForecastShortfall;
  totals: ForecastTotals;
  days: ForecastDay[];
  events: ForecastEvent[];
  overdue_collections: OverdueCollection[];
  no_date_collections: NoDateCollection[];
  assumptions: ForecastAssumptions;
}

/** Error body returned with 4xx/5xx responses. */
export interface CashForecastErrorResponse {
  error: string;
}