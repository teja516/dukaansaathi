// Auto-generated from the reviewed schema — canonical CustomerPaymentAllocation shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface CustomerPaymentAllocation {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  customerPaymentId: string;
  creditTransactionId: string;
  amountPaise: number;
}
