export type CreditTransactionStatus = 'unpaid' | 'partially_paid' | 'paid';

export type CreditTransactionExpectedFilter = 'any' | 'overdue' | 'none';

export interface CreditTransaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  customerId: string;
  amountPaise: number;
  remainingAmountPaise: number;
  transactionDate: string;
  expectedPaymentDate: string | null;
  description: string | null;
  status: CreditTransactionStatus;
  isSample: boolean;
}

export interface CreditTransactionListQuery {
  customer_id?: string;
  status?: CreditTransactionStatus;
  expected?: CreditTransactionExpectedFilter;
  page?: number;
  limit?: number;
}

export interface CreditTransactionListResponse {
  creditTransactions: CreditTransaction[];
}

export interface CreditTransactionResponse {
  creditTransaction: CreditTransaction;
}

export interface CreditTransactionErrorResponse {
  error: string;
}

export interface CreateCreditTransactionInput {
  customerId: string;
  amountPaise: number;
  transactionDate: string;
  expectedPaymentDate?: string | null;
  description?: string | null;
}

export interface UpdateCreditTransactionInput {
  description?: string | null;
  transactionDate?: string;
  expectedPaymentDate?: string | null;
  amountPaise?: number;
}

export interface CreditSaleFormValues {
  customerId: string;
  amount: string;
  transactionDate: string;
  expectedPaymentDate: string;
  description: string;
}

export interface CreditSaleFormErrors {
  customerId?: string;
  amount?: string;
  transactionDate?: string;
  expectedPaymentDate?: string;
  description?: string;
}

export interface CreditSaleSummary {
  customerId: string;
  customerName: string;
  amountPaise: number;
  transactionDate: string;
  expectedPaymentDate: string | null;
  description: string | null;
}

export type CreditSaleStep = 'reviewing' | 'confirmed' | 'saved';

export interface CreditTransactionServiceFilters {
  shopId: string;
  customerId?: string;
  status?: CreditTransactionStatus;
  expected?: CreditTransactionExpectedFilter;
  page?: number;
  limit?: number;
}