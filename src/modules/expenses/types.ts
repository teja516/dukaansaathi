/**
 * Expenses module: wire types.
 *
 * These describe what the JSON API actually carries (dates as ISO strings,
 * money as integer paise). Components and pages import from here, never from
 * the database layer.
 */

export type ExpensCategory = 'rent' | 'electricity' | 'wages' | 'transport' | 'other';

export type ExpensStatus = 'unpaid' | 'paid' | 'cancelled';

export type ExpensPaymentMethod = 'cash' | 'upi' | 'bank';

/** Filter values accepted by the expenses list endpoint. */
export type ExpensCategoryFilter = ExpensCategory | 'all';

export type ExpensStatusFilter = 'all' | 'paid' | 'unpaid';

/** A single expense as returned by the API. */
export interface Expens {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  category: ExpensCategory;
  /** Positive integer amount in paise (1 INR = 100 paise). */
  amountPaise: number;
  /** Calendar date in YYYY-MM-DD (IST). */
  expenseDate: string;
  /** Calendar date in YYYY-MM-DD. Set for unpaid expenses. */
  dueDate: string | null;
  status: ExpensStatus;
  /** Calendar date in YYYY-MM-DD. Set once the expense is paid. */
  paymentDate: string | null;
  paymentMethod: ExpensPaymentMethod | null;
  description: string | null;
  idempotencyKey: string | null;
  isSample: boolean;
}

/** Query parameters for GET /api/expenses. */
export interface ListExpensesQuery {
  category?: ExpensCategoryFilter;
  status?: ExpensStatusFilter;
}

/** Body for POST /api/expenses. */
export interface CreateExpensInput {
  category: ExpensCategory;
  amountPaise: number;
  expenseDate: string;
  /** Required when status is unpaid. */
  dueDate?: string | null;
  status: Exclude<ExpensStatus, 'cancelled'>;
  /** Required when status is paid. */
  paymentDate?: string | null;
  /** Required when status is paid. */
  paymentMethod?: ExpensPaymentMethod | null;
  description?: string | null;
  /** Client-generated key so a retried submit does not create a second expense. */
  idempotencyKey: string;
}

/** Body for PATCH /api/expenses/{expenseId}. Status cannot change here. */
export interface UpdateExpensInput {
  category?: ExpensCategory;
  amountPaise?: number;
  expenseDate?: string;
  dueDate?: string | null;
  description?: string | null;
}

/** Body for POST /api/expenses/{expenseId}/mark-paid. */
export interface MarkExpensPaidInput {
  paymentDate: string;
  paymentMethod: ExpensPaymentMethod;
}

/** Body for POST /api/expenses/{expenseId}/cancel. */
export type CancelExpensInput = Record<string, never>;

/** Response envelope for GET /api/expenses. */
export interface ExpensListResponse {
  expenses: Expens[];
}

/** Response envelope for single-expense endpoints. */
export interface ExpensResponse {
  expens: Expens;
}

/** Response envelope for error replies. */
export interface ExpensErrorResponse {
  error: string;
}