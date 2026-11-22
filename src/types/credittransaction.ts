// Auto-generated from the reviewed schema — canonical CreditTransaction shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface CreditTransaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  customerId: string;
  amountPaise: number;
  remainingAmountPaise: number;
  transactionDate: string;
  expectedPaymentDate?: string | null;
  description?: string | null;
  status: string;
  isSample?: boolean | null;
}
