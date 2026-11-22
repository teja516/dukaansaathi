// Auto-generated from the reviewed schema — canonical CashMovement shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface CashMovement {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  direction: string;
  amountPaise: number;
  paymentMethod: string;
  movementDate: string;
  customerPaymentId?: string | null;
  supplierPaymentId?: string | null;
  expenseId?: string | null;
  isSample?: boolean | null;
}
