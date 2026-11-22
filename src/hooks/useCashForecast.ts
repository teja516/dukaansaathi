'use client';
import { getCashForecast } from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';

export type ForecastPeriod = '30' | '60' | '90';

export function useCashForecast(period: ForecastPeriod) {
  return useAsync(() => getCashForecast({ period }), [period]);
}
