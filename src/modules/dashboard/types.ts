// Dashboard module types. Wire shapes only: money is integer paise (number),
// dates are 'YYYY-MM-DD' in Asia/Kolkata, timestamps are ISO-8601 strings.

export type DashboardLanguage = 'english' | 'hindi';

export type DashboardCurrency = 'INR';

export type DashboardAlertCategory = 'collections' | 'supplier' | 'expenses' | 'cash_risk';

export type DashboardCashRiskLevel = 'none' | 'low' | 'medium' | 'high';

export type DashboardObligationKind = 'supplier_bill' | 'expense' | 'collection';

export type DashboardObligationDirection = 'incoming' | 'outgoing';

export type DashboardActivityType =
  | 'credit_sale'
  | 'customer_payment'
  | 'supplier_bill'
  | 'supplier_payment'
  | 'expense'
  | 'expense_paid'
  | 'cash_inflow'
  | 'cash_outflow';

export interface DashboardQuery {
  shop_id?: string;
  language?: DashboardLanguage;
}

export interface DashboardAvailableCash {
  openingBalancePaise: number;
  actualInflowsPaise: number;
  actualOutflowsPaise: number;
  availablePaise: number;
  receivedTodayPaise: number;
}

export interface DashboardCustomerOutstanding {
  totalPaise: number;
  overduePaise: number;
  customerCount: number;
  overdueCustomerCount: number;
  nextExpectedDate: string | null;
}

export interface DashboardSupplierOutstanding {
  totalPaise: number;
  supplierCount: number;
  nextDueDate: string | null;
  nextDueAmountPaise: number | null;
}

export interface DashboardObligation {
  id: string;
  kind: DashboardObligationKind;
  direction: DashboardObligationDirection;
  label: string;
  amountPaise: number;
  dueDate: string;
  daysUntilDue: number;
  sourceId: string;
}

export interface DashboardNext7Days {
  /** Expected collections (incoming), chronological. */
  incoming: DashboardObligation[];
  /** Unpaid supplier bills and unpaid expenses (outgoing), chronological. */
  outgoing: DashboardObligation[];
  incomingTotalPaise: number;
  outgoingTotalPaise: number;
}

export interface DashboardPriorityAction {
  id: string;
  /** 1-based rank, at most five actions per dashboard response. */
  rank: number;
  category: DashboardAlertCategory;
  title: string;
  detail: string;
  amountPaise: number | null;
  dueDate: string | null;
  sourceType: 'credit_transaction' | 'supplier_bill' | 'expense' | 'cash_forecast';
  sourceId: string | null;
  href: string;
}

export interface DashboardCashRisk {
  level: DashboardCashRiskLevel;
  projectedLowestBalancePaise: number;
  projectedLowestBalanceDate: string | null;
  shortfallPaise: number;
  /** Shortfall date when the forecast shows one, otherwise null. */
  shortfallDate: string | null;
}

export interface DashboardActivityEvent {
  id: string;
  type: DashboardActivityType;
  occurredAt: string;
  amountPaise: number | null;
  description: string;
}

export interface DashboardData {
  shopId: string;
  shopName: string;
  language: DashboardLanguage;
  currency: DashboardCurrency;
  /** Today's date in Asia/Kolkata, 'YYYY-MM-DD'. */
  asOfDate: string;
  /** True when the shop has no customers, bills, expenses or payments yet. */
  isEmpty: boolean;
  availableCash: DashboardAvailableCash;
  customerOutstanding: DashboardCustomerOutstanding;
  supplierOutstanding: DashboardSupplierOutstanding;
  next7Days: DashboardNext7Days;
  /** At most five items, ordered by urgency and impact. */
  priorityActions: DashboardPriorityAction[];
  cashRisk: DashboardCashRisk;
  /** At most ten items, most recent first. */
  recentActivity: DashboardActivityEvent[];
}

/** Envelope returned by GET /api/dashboard. Clients receive DashboardData. */
export interface DashboardResponse {
  dashboard: DashboardData;
}