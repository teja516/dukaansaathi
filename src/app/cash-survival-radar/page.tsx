'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getCashSurvivalRadar } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { PeriodSelector, type Period } from '@/components/PeriodSelector';
import { AmountDisplay } from '@/components/AmountDisplay';
import { RiskSummaryCard } from '@/components/RiskSummaryCard';
import { CashCurveChart } from '@/components/CashCurveChart';
import { TransactionListRow } from '@/components/TransactionListRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function Radar() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>('30');
  const { data, error, loading, reload } = useAsync(() => getCashSurvivalRadar({ period }), [period]);
  const more = (data as unknown as { more?: { collections: number; obligations: number } } | null)?.more ?? { collections: 0, obligations: 0 };

  return (
    <>
      <PageHeader title={t('Cash Survival Radar')} description={t('An early warning if cash may run short.')} backHref="/cash-forecast" backLabel={t('Cash Forecast')} />
      <div className="mb-4"><PeriodSelector value={period} onChange={setPeriod} /></div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-6">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Cash you have today')}</p>
              <AmountDisplay paise={(data as unknown as { available_paise?: number }).available_paise ?? 0} size="lg" />
            </Card>
            <RiskSummaryCard
              riskState={data.risk_state}
              lowestBalancePaise={data.lowest_balance_paise}
              lowestBalanceDate={data.lowest_balance_date}
              shortfallPaise={data.shortfall_paise}
              thresholdPaise={data.safety_threshold_paise}
            />
            <Card>
              <CardHeader><CardTitle>{t('Expected cash balance')}</CardTitle></CardHeader>
              <CardContent><CashCurveChart points={data.curve} thresholdPaise={data.safety_threshold_paise} /></CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>{t('Payments you are counting on')}</CardTitle></CardHeader>
                <CardContent className="divide-y p-0">
                  {data.drivers.collections.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('None before the lowest point.')}</p>}
                  {data.drivers.collections.map((c) => (
                    <TransactionListRow key={c.credit_transaction_id} title={c.customer_name} subtitle={t('Expected {date}', { date: formatDate(c.expected_payment_date) })} amountPaise={c.amount_paise} direction="in" />
                  ))}
                  {more.collections > 0 && <p className="px-5 py-3 text-xs text-muted-foreground">{t('+{n} more, see Cash Forecast', { n: more.collections })}</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('Bills and expenses before the lowest point')}</CardTitle></CardHeader>
                <CardContent className="divide-y p-0">
                  {data.drivers.obligations.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('None before the lowest point.')}</p>}
                  {data.drivers.obligations.map((o) => (
                    <TransactionListRow key={`${o.source_type}-${o.source_id}`} title={o.label} subtitle={t('Due {date}', { date: formatDate(o.due_date) })} amountPaise={o.amount_paise} direction="out" />
                  ))}
                  {more.obligations > 0 && <p className="px-5 py-3 text-xs text-muted-foreground">{t('+{n} more, see Cash Forecast', { n: more.obligations })}</p>}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>{t('What you can do')}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ul className="list-disc space-y-1.5 pl-5">
                  <li>{t('Follow up with the customer who owes the most and is overdue.')}</li>
                  <li>{t('Check whether an upcoming supplier payment can be discussed or rescheduled.')}</li>
                  <li>{t('Review expenses that can wait.')}</li>
                  <li>{t('Check the amount and due date of the bill around the lowest point.')}</li>
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild size="sm"><Link href="/what-if-simulator">{t('Try a what-if')}</Link></Button>
                  <Button asChild size="sm" variant="outline"><Link href="/action-centre">{t('Action Centre')}</Link></Button>
                </div>
                <p className="pt-2 text-xs text-muted-foreground">
                  {t('Possible shortage: lowest balance is below your safety amount (zero unless you set one). Keep an eye: lowest balance is under 25% of today\'s cash.')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}

export default function CashSurvivalRadarPage() {
  return (
    <AppShell>
      <Radar />
    </AppShell>
  );
}
