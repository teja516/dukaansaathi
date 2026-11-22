import type { CustomerPayment } from '@/types/customerpayment';
import type { CustomerPaymentAllocation } from '@/types/customerpaymentallocation';

export type { CustomerPayment } from '@/types/customerpayment';
export type { CustomerPaymentAllocation } from '@/types/customerpaymentallocation';

/** Allowed payment methods. Each saved payment creates one inflow under its method. */
export type PaymentMethod = 'cash' | 'upi' | 'bank';

/** Supplier payment allocation, owned by this module (customer-payments serves the supplier_payment_allocations table). */
export interface SupplierPaymentAllocation {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  supplierPaymentId: string;
  supplierBillId: string;
  amountPaise: number;
}

/** Query for GET /api/customer-payments */
export interface CustomerPaymentListQuery {
  customerId?: string;
  creditTransactionId?: string;
  page?: number;
}

/** Query for GET /api/customer-payments/preview */
export interface CustomerPaymentPreviewQuery {
  customerId?: string;
  creditTransactionId?: string;
  amountPaise?: number;
}

/** One FIFO slice of a preview or of a saved payment. */
export interface CustomerPaymentAllocationSlice {
  creditTransactionId: string;
  amountPaise: number;
}

/** Response of GET /api/customer-payments/preview. Nothing is written. */
export interface CustomerPaymentPreview {
  customerId: string;
  creditTransactionId: string | null;
  amountPaise: number;
  outstandingBeforePaise: number;
  outstandingAfterPaise: number;
  allocations: CustomerPaymentAllocationSlice[];
}

/** Body of POST /api/customer-payments */
export interface CustomerPaymentCreateInput {
  customerId: string;
  creditTransactionId?: string | null;
  amountPaise: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  note?: string | null;
  idempotencyKey: string;
}

/** Result of POST /api/customer-payments. replayed is true when the idempotency key matched an earlier save. */
export interface CustomerPaymentCreateResult {
  customerPayment: CustomerPayment;
  allocations: CustomerPaymentAllocation[];
  replayed: boolean;
}

/** Fields that may change on an existing payment. Amount and allocations are immutable once saved. */
export type CustomerPaymentUpdateInput = Partial<
  Pick<CustomerPayment, 'note' | 'paymentDate' | 'paymentMethod'>
>;

/** Response of GET /api/customer-payments/{customerPaymentId}/allocations */
export type CustomerPaymentAllocationsResponse = CustomerPaymentAllocation[];

/** Input for creating a customer payment allocation row (written inside the payment-recording transaction). */
export interface CustomerPaymentAllocationCreateInput {
  customerPaymentId: string;
  creditTransactionId: string;
  amountPaise: number;
}

/** Input for updating a customer payment allocation row. */
export type CustomerPaymentAllocationUpdateInput = Partial<
  Pick<CustomerPaymentAllocation, 'amountPaise' | 'creditTransactionId'>
>;

/** Input for creating a supplier payment allocation row. */
export interface SupplierPaymentAllocationCreateInput {
  supplierPaymentId: string;
  supplierBillId: string;
  amountPaise: number;
}

/** Input for updating a supplier payment allocation row. */
export type SupplierPaymentAllocationUpdateInput = Partial<
  Pick<SupplierPaymentAllocation, 'amountPaise' | 'supplierBillId'>
>;