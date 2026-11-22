/**
 * Alerts module types.
 *
 * Wire shapes for the Action Centre. Entity fields use the canonical camelCase
 * names. Timestamps and dates are ISO-8601 strings and money is integer paise,
 * because this is what the JSON API carries. Request query and body fields use
 * the snake_case names the API client sends.
 *
 * Type-only file: no runtime values or functions live here.
 */

export type AlertType =
  | 'projected_shortage'
  | 'large_overdue_receivable'
  | 'obligation_due_soon'
  | 'overdue_receivable'
  | 'reminder';

export type AlertFilterCategory = 'collections' | 'supplier' | 'expenses' | 'cash_risk';

export type AlertStatus = 'new' | 'reviewed' | 'action_taken' | 'resolved';

export type AlertSourceRecordType =
  | 'credit_transaction'
  | 'supplier_bill'
  | 'expense'
  | 'cash_forecast';

/**
 * Lower value = higher priority. Ordering: projected shortage with a near-term
 * date, large overdue receivables, obligations due soon, other overdue
 * receivables, then lower-urgency reminders.
 */
export type AlertPriorityRank = 1 | 2 | 3 | 4 | 5;

export type Alert = {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopId: string;
  alertType: AlertType;
  filterCategory: AlertFilterCategory;
  status: AlertStatus;
  priorityRank: AlertPriorityRank;
  amountPaise: number;
  dueDate: string | null;
  sourceRecordType: AlertSourceRecordType;
  sourceRecordId: string;
  customerId: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  actionTakenAt: string | null;
  actionNote: string | null;
  resolvedAt: string | null;
};

/** Query parameters accepted by GET /api/alerts. */
export type ListAlertsQuery = {
  filter_category?: AlertFilterCategory;
  status?: AlertStatus;
};

/** Response envelope for GET /api/alerts. */
export type ListAlertsResponse = {
  alerts: Alert[];
};

/** Response envelope for GET /api/alerts/{alertId}. */
export type GetAlertResponse = {
  alert: Alert;
};

/** Route parameters for the single-alert endpoints. */
export type AlertIdParams = {
  alertId: string;
};

/** Response envelope for POST /api/alerts/{alertId}/review. */
export type ReviewAlertResponse = {
  alert: Alert;
};

/** Request body for POST /api/alerts/{alertId}/take-action. */
export type TakeActionAlertInput = {
  action_note?: string;
};

/** Response envelope for POST /api/alerts/{alertId}/take-action. */
export type TakeActionAlertResponse = {
  alert: Alert;
};

/** Response envelope for POST /api/alerts/sync. */
export type SyncAlertsResponse = {
  alerts: Alert[];
};

/** Input shape for creating an alert from another module's public API. */
export type CreateAlertInput = {
  shopId: string;
  alertType: AlertType;
  filterCategory: AlertFilterCategory;
  priorityRank: AlertPriorityRank;
  amountPaise: number;
  dueDate?: string | null;
  sourceRecordType: AlertSourceRecordType;
  sourceRecordId: string;
  customerId?: string | null;
};

/** Partial update applied to an existing alert. */
export type UpdateAlertInput = Partial<{
  alertType: AlertType;
  filterCategory: AlertFilterCategory;
  status: AlertStatus;
  priorityRank: AlertPriorityRank;
  amountPaise: number;
  dueDate: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  actionTakenAt: string | null;
  actionNote: string | null;
  resolvedAt: string | null;
}>;

/** Filters accepted by the module's listAlerts operation. */
export type ListAlertsFilter = {
  shopId: string;
  filterCategory?: AlertFilterCategory;
  status?: AlertStatus;
};