// Auto-generated from the reviewed schema — canonical SupplierPaymentAllocation shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface SupplierPaymentAllocation {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  supplierPaymentId: string;
  supplierBillId: string;
  amountPaise: number;
}
