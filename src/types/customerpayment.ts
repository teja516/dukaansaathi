// Auto-generated from the reviewed schema — canonical CustomerPayment shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface CustomerPayment {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  customerId: string;
  creditTransactionId: string;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: string;
  note?: string | null;
  idempotencyKey: string;
  isSample?: boolean | null;
}
