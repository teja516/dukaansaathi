// Auto-generated from the reviewed schema — canonical Shop shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Shop {
  id: string;
  createdAt: string;
  updatedAt: string;
  shopName: string;
  ownerName?: string | null;
  currency: string;
  interfaceLanguage: string;
  openingCashBalancePaise: number;
  openingBankBalancePaise: number;
  cashSafetyThresholdPaise: number;
  setupCompletedAt?: string | null;
}
