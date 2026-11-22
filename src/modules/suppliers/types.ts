/**
 * Supplier module types.
 *
 * Wire shapes for the suppliers module's endpoints. Every timestamp is an ISO
 * 8601 string and every amount is integer paise, because this is what the JSON
 * API actually carries. Server-only database row types stay in the Drizzle
 * schema and never leak into components.
 */

export type SupplierBillStatus = 'unpaid' | 'partially_paid' | 'paid';

export type SupplierFilter = 'all' | 'overdue';

export type SupplierSort = 'highest_payable' | 'nearest_due' | 'name';

/** Canonical supplier record as returned by the API. */
export interface Supplier {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  name: string;
  phoneNumber: string | null;
  notes: string | null;
  isSample: boolean;
}

/** One row of the supplier directory, with payable derived from bills minus payments. */
export interface SupplierSummary extends Supplier {
  /** Supplier bills minus linked supplier payments, in paise. */
  payablePaise: number;
  /** Earliest due date among unpaid bills (ISO date, IST), or null when nothing is open. */
  nearestUnpaidDueDate: string | null;
  /** True when any unpaid bill is past its due date in IST. */
  isOverdue: boolean;
}

/** A supplier bill as shown inside the supplier detail view. */
export interface SupplierDetailBill {
  id: string;
  supplierId: string;
  billDate: string;
  dueDate: string;
  amountPaise: number;
  paidPaise: number;
  status: SupplierBillStatus;
  reference: string | null;
}

/** A supplier payment as shown inside the supplier detail view. */
export interface SupplierDetailPayment {
  id: string;
  supplierId: string;
  supplierBillId: string;
  paidAt: string;
  amountPaise: number;
  reference: string | null;
}

/** One entry of the supplier activity history, ordered by date. */
export interface SupplierActivityItem {
  id: string;
  kind: 'bill' | 'payment';
  occurredAt: string;
  amountPaise: number;
  reference: string | null;
}

/** Full supplier detail: record, history and derived payable figures. */
export interface SupplierDetail extends SupplierSummary {
  bills: SupplierDetailBill[];
  payments: SupplierDetailPayment[];
  activity: SupplierActivityItem[];
}

/** Query parameters accepted by GET /api/suppliers. */
export interface ListSuppliersQuery {
  q?: string;
  filter?: SupplierFilter;
  sort?: SupplierSort;
  page?: number;
  limit?: number;
}

/** Response payload of GET /api/suppliers. */
export interface SupplierListResult {
  suppliers: SupplierSummary[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Body accepted by POST /api/suppliers.
 * The shop is never accepted from the browser; it comes from the session.
 * The stored balance is never accepted; it is derived from bills and payments.
 */
export interface CreateSupplierInput {
  name: string;
  phoneNumber?: string | null;
  notes?: string | null;
  /** Client-generated key so a double tap or retried request creates one record. */
  clientRequestId?: string;
  /** Set to true after the shopkeeper confirms saving a name that already exists. */
  confirmDuplicate?: boolean;
}

/** Body accepted by PATCH /api/suppliers/{supplierId}. All fields optional. */
export interface UpdateSupplierInput {
  name?: string;
  phoneNumber?: string | null;
  notes?: string | null;
}

/** Response payload of DELETE /api/suppliers/{supplierId} on conflict. */
export interface SupplierDeleteConflict {
  error: string;
  billCount: number;
  paymentCount: number;
}

export type { Supplier as SupplierRecord };