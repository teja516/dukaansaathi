// Types for the supplier-payments module. Wire shapes: dates are ISO strings and money is integer paise.

export type PaymentMethod = 'cash' | 'upi' | 'bank';

export type SupplierPaymentStatus = 'recorded' | 'reversed';

export interface SupplierPayment {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  supplierId: string;
  supplierBillId: string;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note: string | null;
  idempotencyKey: string;
  isSample: boolean;
}

export interface SupplierPaymentAllocation {
  id: string;
  createdAt: string;
  supplierPaymentId: string;
  supplierBillId: string;
  amountPaise: number;
}

export interface SupplierPaymentListQuery {
  supplier_id?: string;
  supplier_bill_id?: string;
  page?: number;
  limit?: number;
}

export interface SupplierPaymentPreviewQuery {
  supplier_id?: string;
  supplier_bill_id?: string;
  amount_paise?: number;
}

export interface SupplierPaymentPreview {
  supplierId: string;
  supplierBillId: string;
  isFifoDefault: boolean;
  billAmountPaise: number;
  remainingBeforePaise: number;
  amountPaise: number;
  remainingAfterPaise: number;
  overpaid: boolean;
  paymentDate: string;
}

export interface CreateSupplierPaymentInput {
  supplierId?: string;
  supplierBillId?: string;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note?: string | null;
  idempotencyKey: string;
  confirmed: boolean;
}

export type UpdateSupplierPaymentInput = Partial<
  Pick<SupplierPayment, 'note' | 'paymentDate' | 'paymentMethod'>
>;

export interface SupplierPaymentRecordResult {
  supplierPayment: SupplierPayment;
  allocations: SupplierPaymentAllocation[];
  replayed: boolean;
}

export interface SupplierPaymentAllocationsResult {
  supplierPaymentId: string;
  allocations: SupplierPaymentAllocation[];
}