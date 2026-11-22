// Auto-generated from the reviewed schema — canonical Expens shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Expens {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  category: string;
  amountPaise: number;
  expenseDate: string;
  dueDate?: string | null;
  status: string;
  paymentDate?: string | null;
  paymentMethod?: string | null;
  description?: string | null;
  idempotencyKey: string;
  isSample?: boolean | null;
}
