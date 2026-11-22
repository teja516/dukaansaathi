'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getCashForecast } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { MetricCard } from '@/components/MetricCard';
import { AmountDisplay } from '@/components/AmountDisplay';
import { PeriodSelector, type Period } from '@/components/PeriodSelector';
import { CashCurveChart } from '@/components/CashCurveChart';
import { ScheduleList } from '@/components/ScheduleList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionListRow } from '@/components/TransactionListRow';
import { formatPaise } from '@/lib/utils';

interface Excluded {
  customer_name: string;
  amount_paise: number;
  expected_payment_date: string | null;
  reason: 'overdue' | 'no_date';
  source_id: string;
}

function Forecast() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>('30');
  const { data, error, loading, reload } = useAsync(() => getCashForecast({ period }), [period]);

  return (
    <>
      <PageHeader
        title={t('Cash Forecast')}
        description={t('What your cash may look like, based on the dates you entered.')}
        actions={
          <>
            <Button asChild variant="outline" size="sm"><Link href="/cash-survival-radar">{t('Cash Survival Radar')}</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/what-if-simulator">{t('What-if Scenario')}</Link></Button>
          </>
        }
      />
      <div className="mb-4"><PeriodSelector value={period} onChange={setPeriod} /></div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label={t('Cash today')} paise={data.starting_available_paise} />
              <MetricCard label={t('Expected in')} paise={data.expected_inflows_paise} tone="positive" hint={t('{n} customer payments expected', { n: (data as unknown as { expected_collections_count?: number }).expected_collections_count ?? 0 })} />
              <MetricCard label={t('Due out')} paise={data.scheduled_outflows_paise} tone="negative" hint={t('{n} bills and expenses', { n: (data as unknown as { scheduled_obligations_count?: number }).scheduled_obligations_count ?? 0 })} />
              <MetricCard
                label={t('Lowest balance')}
                paise={data.lowest_balance_paise}
                tone={data.lowest_balance_paise < 0 ? 'negative' : 'neutral'}
                hint={t('on {date}', { date: formatDate(data.lowest_balance_date) })}
              />
            </div>

            <Card className="p-5">
              <p className="text-sm text-muted-foreground">
                {t('Expected cash after {n} days', { n: data.period_days })} · {formatDate(data.days[data.days.length - 1]?.date)}
              </p>
              <AmountDisplay paise={(data as unknown as { ending_balance_paise?: number }).ending_balance_paise ?? 0} size="xl" tone="auto" />
              <p className="mt-1 text-xs text-muted-foreground">{t('An estimate, not a guarantee.')}</p>
            </Card>

            <Card>
              <CardHeader><CardTitle>{t('Expected cash balance')}</CardTitle></CardHeader>
              <CardContent>
                <CashCurveChart points={data.days} />
              </CardContent>
            </Card>

            <Card>
              <details>
              <summary className="cursor-pointer list-none px-5 py-4 font-heading text-base font-semibold">{t('How was this estimate made?')}</summary>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-5 text-sm">
                  <li>{t('Cash you have today: {amount}', { amount: formatPaise(data.starting_available_paise) })}</li>
                  <li>{t('Customer payments expected in this period: {amount}', { amount: formatPaise(data.expected_inflows_paise) })}</li>
                  <li>{t('Supplier bills and expenses due in this period: {amount}', { amount: formatPaise(data.scheduled_outflows_paise) })}</li>
                  <li>
                    {data.overdue_excluded_paise > 0
                      ? t('Overdue customer payments left out: {amount}', { amount: formatPaise(data.overdue_excluded_paise) })
                      : t('No customer payments are overdue.')}
                  </li>
                  <li>{t('Bills and expenses already overdue are counted as due today.')}</li>
                  <li>{t('Credit with no expected date is left out.')}</li>
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">{t('Last updated {date}', { date: new Date(data.calculated_at).toLocaleString('en-IN') })}</p>
              </CardContent>
              </details>
            </Card>

            {(data as unknown as { excluded?: Excluded[] }).excluded?.length ? (
              <Card className="border-warning/40">
                <CardHeader>
                  <CardTitle>{t('Not counted in this forecast')}</CardTitle>
                  <p className="text-sm text-muted-foreground">{t('These customer payments are left out because we cannot say when they will arrive.')} {t('Tap one to set a new expected date.')}</p>
                </CardHeader>
                <CardContent className="divide-y p-0">
                  {(data as unknown as { excluded: Excluded[] }).excluded.map((x) => (
                    <TransactionListRow
                      key={x.source_id}
                      title={x.customer_name}
                      subtitle={x.reason === 'overdue' ? t('Was expected {date}', { date: formatDate(x.expected_payment_date) }) : t('No expected date')}
                      amountPaise={x.amount_paise}
                      badge={<StatusBadge status={x.reason === 'overdue' ? 'overdue' : 'pending'} />}
                      href={`/credit-sales/${x.source_id}?edit=expected`}
                    />
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader><CardTitle>{t('Money coming in and going out')}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <ScheduleList items={data.events} empty={t('Nothing is scheduled in this period.')} />
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}

export default function CashForecastPage() {
  return (
    <AppShell>
      <Forecast />
    </AppShell>
  );
}
