export type ForecastPeriod = '30' | '60' | '90';

export type ShortageStatus = 'none' | 'new' | 'worsened' | 'unchanged_shortage';

export type ObligationKind = 'supplier_bill' | 'expense';

export type SimulatedLabel = 'simulated';

export type EligibilityReason =
  | 'fully_paid'
  | 'no_expected_date'
  | 'overdue_needs_revised_date';

export interface ForecastLowPoint {
  balance_paise: number;
  date: string;
}

export interface SimulatedLowPoint extends ForecastLowPoint {
  label: SimulatedLabel;
}

export interface AffectedObligation {
  id: string;
  kind: ObligationKind;
  label: string;
  due_date: string;
  amount_paise: number;
  is_simulated_window: true;
}

export interface EligibleCreditSale {
  credit_transaction_id: string;
  customer_name: string;
  outstanding_paise: number;
  expected_payment_date: string | null;
  is_overdue: boolean;
  is_eligible: boolean;
  ineligible_reason: EligibilityReason | null;
}

export interface WhatIfScenarioSource {
  credit_transaction_id: string;
  customer_name: string;
  outstanding_paise: number;
  original_expected_date: string;
  revised_expected_date: string;
  delay_days: number;
}

export interface WhatIfScenarioQuery {
  credit_transaction_id?: string;
  delay_days?: number;
}

export interface WhatIfScenarioInput {
  credit_transaction_id: string;
  delay_days: number;
  scenario_label?: string;
}

export interface WhatIfScenarioResult {
  period: ForecastPeriod;
  source: WhatIfScenarioSource;
  original: ForecastLowPoint;
  simulated: SimulatedLowPoint;
  difference_paise: number;
  safety_threshold_paise: number;
  shortage_status: ShortageStatus;
  affected_obligations: AffectedObligation[];
  is_persisted: false;
}

export interface WhatIfScenarioResponse {
  scenario: WhatIfScenarioResult;
}

export interface WhatIfScenarioErrorResponse {
  error: string;
}