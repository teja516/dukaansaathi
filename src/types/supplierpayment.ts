// Auto-generated from the reviewed schema — canonical SupplierPayment shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface SupplierPayment {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  supplierId: string;
  supplierBillId: string;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: string;
  note?: string | null;
  idempotencyKey: string;
  isSample?: boolean | null;
}
