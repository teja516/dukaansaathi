export type ShopInterfaceLanguage = 'english' | 'hindi';

export type ShopCurrency = 'INR';

export type AuditEventIsoTimestamp = string;

export interface Shop {
  id: string;
  createdAt: AuditEventIsoTimestamp;
  updatedAt: AuditEventIsoTimestamp;
  shopName: string;
  ownerName: string | null;
  currency: ShopCurrency;
  interfaceLanguage: ShopInterfaceLanguage;
  openingCashBalancePaise: number;
  openingBankBalancePaise: number;
  cashSafetyThresholdPaise: number;
  setupCompletedAt: AuditEventIsoTimestamp | null;
}

export interface AuditEvent {
  id: string;
  createdAt: AuditEventIsoTimestamp;
  updatedAt: AuditEventIsoTimestamp;
  shopId: string;
  actorUserId: string | null;
  actionType: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
}

/** Unsaved values held on the Welcome / Shop Setup review screen until the owner confirms. */
export interface ShopSetupDraft {
  shopName: string;
  ownerName?: string;
  openingCashBalancePaise: number;
  openingBankBalancePaise?: number;
  interfaceLanguage: ShopInterfaceLanguage;
}

/** Body for POST /api/shops. Currency is fixed to INR by the server. */
export interface CreateShopInput {
  shopName: string;
  ownerName?: string | null;
  openingCashBalancePaise: number;
  openingBankBalancePaise?: number;
  interfaceLanguage: ShopInterfaceLanguage;
}

/** Body for PATCH /api/shops/{shopId}. Every field is optional; only provided fields change. */
export interface UpdateShopInput {
  shopName?: string;
  ownerName?: string | null;
  openingCashBalancePaise?: number;
  openingBankBalancePaise?: number;
  cashSafetyThresholdPaise?: number;
  interfaceLanguage?: ShopInterfaceLanguage;
}

/** Body for POST /api/shops/{shopId}/complete-setup. */
export interface CompleteShopSetupInput {
  reviewConfirmed: boolean;
}

/** Body for POST /api/shops/{shopId}/sample-data. */
export interface LoadShopSampleDataInput {
  confirmed: boolean;
}

export interface ShopSampleDataResult {
  customersCreated: number;
  suppliersCreated: number;
  creditSalesCreated: number;
  supplierBillsCreated: number;
  expensesCreated: number;
}

export interface ListShopsQuery {
  limit?: number;
  offset?: number;
}

export interface ListAuditEventsQuery {
  shopId: string;
  entityType?: string;
  actionType?: string;
  limit?: number;
  offset?: number;
}

export interface CreateAuditEventInput {
  shopId: string;
  actorUserId?: string | null;
  actionType: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAuditEventInput {
  actorUserId?: string | null;
  actionType?: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}