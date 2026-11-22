// Auto-generated from the reviewed schema — canonical SupplierBill shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface SupplierBill {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  supplierId: string;
  amountPaise: number;
  remainingAmountPaise: number;
  billDate: string;
  dueDate: string;
  description?: string | null;
  status: string;
  isSample?: boolean | null;
  reference?: string | null;
}
