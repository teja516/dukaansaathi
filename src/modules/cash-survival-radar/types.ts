export type RadarPeriod = '30' | '60' | '90';

export type ForecastPeriodDays = 30 | 60 | 90;

export type RadarRiskState = 'normal' | 'watch' | 'shortage';

export type RadarFlowDirection = 'inflow' | 'outflow';

export type RadarFlowKind = 'collection' | 'supplier_bill' | 'expense';

export type RadarFlowStatus = 'due_today' | 'due_soon' | 'overdue' | 'no_expected_date' | 'expected';

export interface RadarFlowItem {
  id: string;
  kind: RadarFlowKind;
  direction: RadarFlowDirection;
  label: string;
  counterpartyName: string | null;
  dueDate: string | null;
  amountPaise: number;
  outstandingPaise: number;
  status: RadarFlowStatus;
  sourceRecordId: string;
  isExpected: boolean;
}

export interface RadarForecastPoint {
  date: string;
  inflowPaise: number;
  outflowPaise: number;
  closingBalancePaise: number;
}

export interface RadarReceivableSummary {
  overdueCount: number;
  overduePaise: number;
  undatedCount: number;
  undatedPaise: number;
}

export interface CashSurvivalRadar {
  period: ForecastPeriodDays;
  todayIst: string;
  availableCashPaise: number;
  safetyThresholdPaise: number;
  watchBandRatio: number;
  lowestBalancePaise: number;
  lowestBalanceDate: string;
  shortfallPaise: number;
  riskState: RadarRiskState;
  curve: RadarForecastPoint[];
  drivingCollections: RadarFlowItem[];
  drivingObligations: RadarFlowItem[];
  receivables: RadarReceivableSummary;
}

export interface CashSurvivalRadarEnvelope {
  radar: CashSurvivalRadar;
}

export interface CashSurvivalRadarQuery {
  period?: RadarPeriod;
}

export interface CashSurvivalRadarErrorBody {
  error: string;
}