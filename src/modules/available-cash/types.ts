/**
 * Available Cash module: wire types.
 *
 * These describe the JSON returned by GET /api/available-cash. Money is
 * always integer paise. Timestamps are ISO-8601 strings. This module owns
 * no tables, so it re-exports no Drizzle or Prisma model types.
 */

export type CashPaymentMethod = 'cash' | 'upi' | 'bank';

export type CashDirection = 'inflow' | 'outflow';

/** Which opening-balance bucket a movement affects. */
export type CashBucket = 'cash_in_hand' | 'bank_upi';

/** The source record a cash movement references. Exactly one per movement. */
export type CashMovementSourceType = 'customer_payment' | 'supplier_payment' | 'expense';

export interface CashMovementSource {
  type: CashMovementSourceType;
  id: string;
  /** Human-readable label, e.g. customer or supplier name. */
  label: string;
}

export interface CashMovement {
  id: string;
  /** ISO-8601 date the money actually moved. */
  occurred_on: string;
  direction: CashDirection;
  amount_paise: number;
  payment_method: CashPaymentMethod;
  bucket: CashBucket;
  source: CashMovementSource;
  /** Set when this row is a reversing movement for an earlier correction. */
  reversal_of_movement_id: string | null;
}

export interface CashBucketBreakdown {
  opening_paise: number;
  inflows_paise: number;
  outflows_paise: number;
  balance_paise: number;
}

export interface AvailableCashBreakdown {
  cash_in_hand: CashBucketBreakdown;
  bank_upi: CashBucketBreakdown;
}

export interface AvailableCash {
  shop_id: string;
  /** opening cash + opening bank/UPI + inflows − outflows, in paise. */
  available_paise: number;
  breakdown: AvailableCashBreakdown;
  /** Newest first. Contains only actual receipts and payments. */
  recent_movements: CashMovement[];
  /** ISO-8601 instant the figure was calculated. Rendered in IST by the UI. */
  calculated_at: string;
}

export interface AvailableCashQuery {
  limit?: number;
}