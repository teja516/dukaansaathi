'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { getCreditTransactions, getWhatIfScenario } from '@/lib/api';
import { addDays, cn, errorMessage, formatDate, formatPaise, todayIST } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { FormField } from '@/components/FormField';
import { NativeSelect } from '@/components/NativeSelect';
import { ScenarioComparison } from '@/components/ScenarioComparison';
import { CashCurveChart } from '@/components/CashCurveChart';
import { AmountDisplay } from '@/components/AmountDisplay';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Side {
  lowest_balance_paise: number;
  lowest_balance_date: string;
  days: { date: string; closing_balance_paise: number; inflow_paise?: number; outflow_paise?: number }[];
}

interface Scenario {
  customer_name: string;
  amount_paise: number;
  delay_days: number;
  original: Side;
  scenario: Side;
  difference_paise: number;
  new_shortage: boolean;
  timeline: {
    date: string;
    kind: string;
    label: string;
    amount_paise: number;
    source_type: string;
    source_id: string;
    moved: boolean;
    original_date: string | null;
    balance_original_paise: number;
    balance_scenario_paise: number;
    risk: 'short' | 'tighter' | 'same';
  }[];
  suggested_action: string;
}

/** Show only the stretch that matters (up to a few days after the last event) instead of all 90 days. */
function zoom<T extends { date: string }>(days: T[], r: Scenario): T[] {
  const last = r.timeline[r.timeline.length - 1]?.date;
  if (!last) return days;
  const end = addDays(last, 5);
  const cut = days.findIndex((d) => d.date > end);
  return cut > 0 ? days.slice(0, cut) : days;
}

function WhatIf() {
  const { t } = useLanguage();
  const preset = useSearchParams().get('credit_transaction_id') ?? '';
  const credits = useAsync(() => getCreditTransactions({ expected: 'any', limit: 200 }), []);
  const [creditId, setCreditId] = useState(preset);
  const [delay, setDelay] = useState('15');
  const [result, setResult] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const today = todayIST();
  // Overdue or undated credits are not in the forecast, so delaying them would change nothing.
  const open = (credits.data?.items ?? []).filter((c) => c.remaining_amount_paise > 0 && !!c.expected_payment_date && c.expected_payment_date >= today);
  const delayNum = Number(delay);
  const delayOk = Number.isInteger(delayNum) && delayNum >= 1 && delayNum <= 90;

  async function run() {
    if (!creditId || !delayOk || busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult((await getWhatIfScenario({ credit_transaction_id: creditId, delay_days: delayNum })) as Scenario);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setCreditId('');
    setDelay('15');
  }

  return (
    <>
      <PageHeader title={t('What-if Scenario')} description={t('What if a customer pays late?')} backHref="/cash-forecast" backLabel={t('Cash Forecast')} />
      <DataState loading={credits.loading} error={credits.error} onRetry={credits.reload}>
        <Card className="mb-6 p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
            <FormField label={t('Which payment?')} htmlFor="credit">
              <NativeSelect id="credit" value={creditId} onChange={(e) => setCreditId(e.target.value)}>
                <option value="">{t('Choose a credit sale')}</option>
                {open.map((c) => (
                  <option key={c.id} value={c.id}>{c.customer_name} — {formatPaise(c.remaining_amount_paise)} ({formatDate(c.expected_payment_date)})</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label={t('Days late')} htmlFor="delay" error={delayOk ? null : t('Enter 1 to 90')}>
              <Input id="delay" inputMode="numeric" value={delay} onChange={(e) => setDelay(e.target.value.replace(/\D/g, ''))} />
            </FormField>
            <Button onClick={run} disabled={!creditId || !delayOk || busy}>{busy ? t('Calculating…') : t('Show what happens')}</Button>
          </div>
          {open.length === 0 && <p className="mt-3 text-sm text-muted-foreground">{t('You have no unpaid credit with an expected date.')}</p>}
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </Card>

        {result && (
          <div className="space-y-6">
            <p className="text-sm">
              {t('If {name} pays {days} days late:', { name: result.customer_name, days: result.delay_days })}
            </p>
            <ScenarioComparison original={result.original} scenario={result.scenario} differencePaise={result.difference_paise} newShortage={result.new_shortage} />
            <Card>
              <CardHeader><CardTitle>{t('Cash balance: actual and if late')}</CardTitle></CardHeader>
              <CardContent>
                <CashCurveChart points={zoom(result.original.days, result)} compare={zoom(result.scenario.days, result)} />
              </CardContent>
            </Card>
            {result.timeline.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('What happens, day by day')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('Money coming in and going out up to the lowest point, with your balance at the end of each day.')}</p>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {result.timeline.map((e) => {
                    const incoming = e.kind === 'expected_collection';
                    return (
                      <div key={`${e.source_type}-${e.source_id}`} className={cn('px-5 py-3', e.risk === 'short' && 'bg-destructive/5')}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {formatDate(e.date)} · {e.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {e.moved
                                ? t('Payment moved from {from} to {to}', { from: formatDate(e.original_date), to: formatDate(e.date) })
                                : incoming
                                  ? t('Expected from customer')
                                  : e.kind === 'supplier_bill_due'
                                    ? t('Supplier bill due')
                                    : t('Expense due')}
                            </p>
                          </div>
                          <AmountDisplay paise={e.amount_paise} tone={incoming ? 'positive' : 'negative'} showSign={false} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          <span className="text-muted-foreground">
                            {t('Balance that day')}: <span className="font-medium text-foreground">{formatPaise(e.balance_original_paise)}</span>
                          </span>
                          <span className="text-muted-foreground">
                            {t('If late')}:{' '}
                            <span className={cn('font-medium', e.balance_scenario_paise < 0 ? 'text-destructive' : 'text-foreground')}>{formatPaise(e.balance_scenario_paise)}</span>
                          </span>
                          {e.risk === 'short' && <Badge variant="destructive">{t('Cash goes short here')}</Badge>}
                          {e.risk === 'tighter' && <Badge variant="warning">{t('Cash is tighter')}</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            <Card className="bg-accent/40 p-4 text-sm">
              <p>{result.new_shortage ? t('This delay would cause a cash shortage. Follow up with this customer early and review the bills and expenses due before it.') : result.difference_paise < 0 ? t('The low point gets worse but stays above zero. Keep an eye on the obligations due around that date.') : t('This delay does not change your lowest cash point in the next 90 days.')}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t('This is only a simulation. Your real records were not changed.')}</p>
            </Card>
            <Button variant="outline" onClick={reset}>{t('Reset scenario')}</Button>
          </div>
        )}
      </DataState>
    </>
  );
}

export default function WhatIfPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <WhatIf />
      </Suspense>
    </AppShell>
  );
}
