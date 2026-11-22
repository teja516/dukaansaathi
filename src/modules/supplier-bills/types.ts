export type SupplierBillStatus = 'unpaid' | 'partially_paid' | 'paid';

export type SupplierBillDisplayStatus =
  | 'partially_paid'
  | 'paid'
  | 'due_soon'
  | 'due_today'
  | 'overdue';

export type SupplierBillStatusFilter = SupplierBillStatus | 'overdue';

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
  description: string | null;
  status: SupplierBillStatus;
  isSample: boolean;
  reference: string | null;
}

export interface SupplierBillPaymentSummary {
  id: string;
  amountPaise: number;
  paymentDate: string;
}

export interface SupplierBillListItem extends SupplierBill {
  supplierName: string;
  displayStatus: SupplierBillDisplayStatus;
  daysUntilDue: number;
}

export interface SupplierBillDetail extends SupplierBill {
  supplierName: string;
  displayStatus: SupplierBillDisplayStatus;
  paidAmountPaise: number;
  payments: SupplierBillPaymentSummary[];
}

export interface ListSupplierBillsQuery {
  status?: SupplierBillStatusFilter;
  supplier_id?: string;
  due_within_days?: number;
  page?: number;
  limit?: number;
}

export interface CreateSupplierBillInput {
  supplierId: string;
  amountPaise: number;
  billDate: string;
  dueDate: string;
  description?: string | null;
  reference?: string | null;
}

export interface UpdateSupplierBillInput {
  description?: string | null;
  reference?: string | null;
  dueDate?: string;
  amountPaise?: number;
}

export interface SupplierBillFormValues {
  supplierId: string;
  amountRupees: string;
  billDate: string;
  dueDate: string;
  description: string;
}

export interface SupplierBillFormErrors {
  supplierId?: string;
  amountRupees?: string;
  billDate?: string;
  dueDate?: string;
  description?: string;
}

export interface SupplierBillsPageSummary {
  supplierOutstandingPaise: number;
  dueSoonCount: number;
  overdueCount: number;
}