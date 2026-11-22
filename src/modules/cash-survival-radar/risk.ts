export type RiskState = 'normal' | 'watch' | 'shortage';

/**
 * Risk state rules (shown to the user, not hidden; spec 6.10 and 21.4):
 *  - shortage: lowest projected balance is below the shop's safety threshold
 *    (the threshold defaults to 0, so by default: balance would go below zero).
 *  - watch: no shortage, but the lowest projected balance is under 25% of today's available cash.
 *  - normal: otherwise.
 */
export function classifyRisk(
  forecast: { lowest_balance_paise: number; starting_available_paise: number },
  thresholdPaise: number,
): RiskState {
  const lowest = forecast.lowest_balance_paise;
  if (lowest < Math.max(thresholdPaise, 0)) return 'shortage';
  if (forecast.starting_available_paise > 0 && lowest < forecast.starting_available_paise * 0.25) return 'watch';
  return 'normal';
}
