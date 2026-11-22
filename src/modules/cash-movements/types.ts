export type CashMovementDirection = 'inflow' | 'outflow';

export type CashMovementPaymentMethod = 'cash' | 'upi' | 'bank';

/** Which balance a movement affects: cash in hand, or bank/UPI. */
export type CashBucket = 'cash_in_hand' | 'bank_upi';

/**
 * Wire shape of a CashMovement as returned by the API.
 * Timestamps are ISO strings and money is integer paise (JSON numbers).
 */
export interface CashMovement {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  direction: CashMovementDirection;
  amountPaise: number;
  paymentMethod: CashMovementPaymentMethod;
  movementDate: string;
  customerPaymentId: string | null;
  supplierPaymentId: string | null;
  expenseId: string | null;
  isSample: boolean;
}

/** Query parameters accepted by GET /api/cash-movements. */
export interface CashMovementListQuery {
  direction?: CashMovementDirection;
  payment_method?: CashMovementPaymentMethod;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}

/** Response envelope for GET /api/cash-movements. */
export interface CashMovementListResponse {
  cashMovements: CashMovement[];
}

/** Input for creating a movement. Each movement references exactly one source record. */
export interface CashMovementCreateInput {
  shopId: string;
  direction: CashMovementDirection;
  amountPaise: number;
  paymentMethod: CashMovementPaymentMethod;
  movementDate: string;
  customerPaymentId?: string | null;
  supplierPaymentId?: string | null;
  expenseId?: string | null;
  isSample?: boolean;
}

/** Input for updating a movement. Only the descriptive fields may change. */
export interface CashMovementUpdateInput {
  paymentMethod?: CashMovementPaymentMethod;
  movementDate?: string;
}

/** Filter used by the service when listing movements for an authorised shop. */
export interface CashMovementListFilter {
  shopId: string;
  direction?: CashMovementDirection;
  paymentMethod?: CashMovementPaymentMethod;
  from?: string;
  to?: string;
  limit?: number;
  page?: number;
}

/** Totals derived from opening balances and movements. Never stored. */
export interface CashBalanceBreakdown {
  cashInHandPaise: number;
  bankUpiPaise: number;
  availableCashPaise: number;
}