import type { customers } from '@/db/schema';

/** Server-side row shape straight from the Drizzle `customers` table. Services only. */
export type CustomerRow = typeof customers.$inferSelect;

/** Wire shape of a customer as returned by the API. Dates are ISO strings. */
export type Customer = {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  name: string;
  phoneNumber: string | null;
  notes: string | null;
  isSample: boolean;
};

/** Derived from credit sales minus linked customer payments. */
export type DueStatus = 'clear' | 'partial' | 'overdue';

/** Allow-listed filter values for the Customers screen. */
export type CustomerFilter = 'all' | 'outstanding' | 'overdue';

/** Allow-listed sort values for the Customers screen. */
export type CustomerSort = 'highest_outstanding' | 'oldest_due' | 'name';

/** Languages supported by the payment reminder draft. */
export type ReminderLanguage = 'english' | 'hindi';

/** Allowed payment methods for a customer payment. */
export type PaymentMethod = 'cash' | 'upi' | 'bank';

/** Query input for GET /api/customers. */
export type CustomerListQuery = {
  q?: string;
  filter?: CustomerFilter;
  sort?: CustomerSort;
  page?: number;
  limit?: number;
};

/** A customer row in the list with derived balances. */
export type CustomerListItem = Customer & {
  outstanding_paise: number;
  overdue_paise: number;
  oldest_unpaid_date: string | null;
  due_status: DueStatus;
};

/** Input for POST /api/customers. The shop is never taken from the body. */
export type CreateCustomerInput = {
  name: string;
  phoneNumber?: string | null;
  notes?: string | null;
};

/** Input for PATCH /api/customers/{customerId}. */
export type UpdateCustomerInput = Partial<CreateCustomerInput>;

/** A credit sale that still has a remaining balance. */
export type UnpaidCreditSale = {
  id: string;
  transactionDate: string;
  dueAt: string | null;
  amountPaise: number;
  remainingPaise: number;
};

/** A payment recorded against this customer. */
export type CustomerPaymentHistoryItem = {
  id: string;
  creditTransactionId: string;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note: string | null;
};

/** A single entry on the customer timeline. */
export type CustomerTimelineEvent = {
  id: string;
  type: 'credit_sale' | 'payment';
  occurredAt: string;
  amountPaise: number;
  description: string | null;
};

/** Full customer record for GET /api/customers/{customerId}. */
export type CustomerDetail = Customer & {
  outstanding_paise: number;
  overdue_paise: number;
  oldest_unpaid_date: string | null;
  due_status: DueStatus;
  unpaidCreditSales: UnpaidCreditSale[];
  payments: CustomerPaymentHistoryItem[];
  timeline: CustomerTimelineEvent[];
};

/** Query input for GET /api/customers/{customerId}/reminder-draft. */
export type ReminderDraftQuery = {
  language?: ReminderLanguage;
};

/** Output of GET /api/customers/{customerId}/reminder-draft. Nothing is sent or stored. */
export type ReminderDraft = {
  customerId: string;
  language: ReminderLanguage;
  outstanding_paise: number;
  message: string;
};