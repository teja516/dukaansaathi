// Auto-generated from the reviewed schema — canonical Alert shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Alert {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  alertType: string;
  filterCategory: string;
  status: string;
  priorityRank: number;
  amountPaise?: number | null;
  dueDate?: string | null;
  sourceRecordType: string;
  sourceRecordId?: string | null;
  customerId?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  actionTakenAt?: string | null;
  actionNote?: string | null;
  resolvedAt?: string | null;
}
