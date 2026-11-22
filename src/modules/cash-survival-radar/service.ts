import { computeForecast } from '@/modules/cash-forecast';
import { classifyRisk } from './risk';
import { computeAvailableCash } from '@/modules/available-cash';

export { classifyRisk, type RiskState } from './risk';

export async function getCashSurvivalRadarSnapshot(shopId: string, periodDays: 30 | 60 | 90) {
  const [forecast, cash] = await Promise.all([computeForecast(shopId, periodDays), computeAvailableCash(shopId)]);
  const threshold = cash.shop.cashSafetyThresholdPaise;
  const relevant = forecast.events.filter((e) => e.date <= forecast.lowest_balance_date);
  const LIMIT = 8;
  const allCollections = relevant.filter((e) => e.kind === 'expected_collection').sort((a, b) => b.amount_paise - a.amount_paise);
  const allObligations = relevant.filter((e) => e.kind !== 'expected_collection').sort((a, b) => b.amount_paise - a.amount_paise);
  const collections = allCollections
    .slice(0, LIMIT)
    .map((e) => ({
      credit_transaction_id: e.source_id,
      customer_name: e.label,
      amount_paise: e.amount_paise,
      expected_payment_date: e.date,
    }));
  const obligations = allObligations
    .slice(0, LIMIT)
    .map((e) => ({
      source_type: e.source_type,
      source_id: e.source_id,
      label: e.label,
      amount_paise: e.amount_paise,
      due_date: e.date,
    }));
  return {
    risk_state: classifyRisk(forecast, threshold),
    available_paise: cash.available_paise,
    safety_threshold_paise: threshold,
    lowest_balance_paise: forecast.lowest_balance_paise,
    lowest_balance_date: forecast.lowest_balance_date,
    shortfall_paise: Math.max(Math.max(threshold, 0) - forecast.lowest_balance_paise, 0),
    curve: forecast.days.map((d) => ({ date: d.date, closing_balance_paise: d.closing_balance_paise })),
    drivers: { collections, obligations },
    more: { collections: Math.max(allCollections.length - LIMIT, 0), obligations: Math.max(allObligations.length - LIMIT, 0) },
    calculated_at: forecast.calculated_at,
  };
}
