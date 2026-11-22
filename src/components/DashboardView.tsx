'use client';
import Link from 'next/link';
import { useState } from 'react';
import { getAuthMe, getCashForecast, getDashboard, createShopSampleData } from '@/lib/api';
import { directAction } from '@/lib/links';
import { errorMessage, formatDate, formatPaise } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { MetricCard } from '@/components/MetricCard';
import { RiskSummaryCard } from '@/components/RiskSummaryCard';
import { ScheduleList } from '@/components/ScheduleList';
import { TransactionListRow } from '@/components/TransactionListRow';
import { AmountDisplay } from '@/components/AmountDisplay';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PeriodSelector, type Period } from '@/components/PeriodSelector';
import { CashCurveChart } from '@/components/CashCurveChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Hi {
  title: string;
  why_it_matters: string;
  recommended_action: string;
}

interface Activity {
  date: string;
  type: string;
  description: string;
  party?: string | null;
  href?: string | null;
  amount_paise: number;
  source_type: string;
  source_id: string;
}

type ForecastState = ReturnType<typeof useAsync<Awaited<ReturnType<typeof getCashForecast>>>>;

/**
 * The 30/60/90-day outlook. Its request is started by the page at the same moment as the dashboard
 * request (not after it), and it keeps its own loading and error state so a failure here never hides the rest.
 */
function ForecastWidget({ period, onPeriod, state }: { period: Period; onPeriod: (p: Period) => void; state: ForecastState }) {
  const { t } = useLanguage();
  const { data, error, loading, reload } = state;
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle>{t('Cash outlook')}</CardTitle>
        <PeriodSelector value={period} onChange={onPeriod} />
      </CardHeader>
      <CardContent>
        <DataState loading={loading} error={error} onRetry={reload}>
          {data && (
            <>
              <CashCurveChart points={data.days} height={220} />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t('This is an estimate from the dates you entered, not a guarantee.')}</p>
                <Button asChild variant="link" size="sm"><Link href="/cash-forecast">{t('Full forecast')}</Link></Button>
              </div>
            </>
          )}
        </DataState>
      </CardContent>
    </Card>
  );
}

function activityTitle(a: Activity, t: (s: string) => string): string {
  const base =
    a.type === 'credit_added'
      ? t('Credit added')
      : a.type === 'bill_added'
        ? t('Supplier bill added')
        : a.type === 'expense_added'
          ? t('Expense recorded')
          : a.type === 'reversal'
            ? t('Payment reversed')
            : a.source_type === 'customer_payment'
              ? t('Received from customer')
              : a.source_type === 'supplier_payment'
                ? t('Paid to supplier')
                : a.source_type === 'expense'
                  ? t('Expense paid')
                  : a.description;
  return a.party ? `${base} · ${a.party}` : base;
}

function Dashboard() {
  const { t, language } = useLanguage();
  const { data, error, loading, reload } = useAsync(() => getDashboard(), []);
  const [period, setPeriod] = useState<Period>('30');
  const forecast = useAsync(() => getCashForecast({ period }), [period]);
  const ext = data as (typeof data & { has_sample_data?: boolean; has_any_records?: boolean; cash_in_hand_paise?: number; bank_upi_paise?: number }) | null;
  // Nothing recorded at all: say so, instead of showing calm "no risk" numbers that mean nothing.
  const empty = !!ext && ext.has_any_records === false;
  const [askSample, setAskSample] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  async function loadSample() {
    setLoadingSample(true);
    setSampleError(null);
    try {
      const me = await getAuthMe();
      if (!me.shop) throw new Error(t('Shop setup is not finished'));
      await createShopSampleData(me.shop.id, { confirmed: true });
      setAskSample(false);
      reload();
    } catch (err) {
      setSampleError(errorMessage(err));
      setAskSample(false);
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <>
      <PageHeader
        title={data ? data.shop_name : t('Dashboard')}
        description={data ? t('Today is {date}', { date: formatDate(data.today_ist) }) : undefined}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/available-cash">{t('Cash details')}</Link>
          </Button>
        }
      />
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-6">
            <Card className="bg-primary p-6 text-primary-foreground">
              <p className="text-sm opacity-90">{t('Available Cash')}</p>
              <AmountDisplay paise={data.available_cash_paise} size="xl" className="!text-primary-foreground" />
              {ext?.cash_in_hand_paise !== undefined && (
                <p className="mt-2 text-sm opacity-90">
                  {t('Cash in hand')}: {formatPaise(ext.cash_in_hand_paise)} · {t('Bank / UPI')}: {formatPaise(ext.bank_upi_paise ?? 0)}
                </p>
              )}
              <p className="mt-1 text-xs opacity-80">{t('Money you actually have: opening balance + received − paid.')}</p>
            </Card>

            {ext?.has_sample_data && (
              <p role="note" className="rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
                {t('This shop contains SAMPLE data (made-up names and amounts, marked "Sample"). Do not treat these numbers as real.')}
              </p>
            )}
            {sampleError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{sampleError}</p>}

            {empty && (
              <EmptyState
                title={t('Nothing recorded yet')}
                description={t('Add your first credit sale or supplier bill to see your cash picture.')}
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button asChild><Link href="/customers/new">{t('Add first customer')}</Link></Button>
                    <Button asChild variant="outline"><Link href="/credit-sales/new">{t('Add credit')}</Link></Button>
                    <Button variant="outline" onClick={() => setAskSample(true)}>{t('Load sample data')}</Button>
                  </div>
                }
              />
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard label={t('Customer Outstanding')} paise={data.customer_outstanding_paise} href="/customers" />
              <MetricCard label={t('Overdue from customers')} paise={data.overdue_customer_paise} tone={data.overdue_customer_paise > 0 ? 'negative' : 'neutral'} href="/customers?filter=overdue" />
              <MetricCard label={t('Supplier Dues')} paise={data.supplier_outstanding_paise} href="/supplier-bills" />
              <MetricCard
                label={t('Due out in 7 days')}
                paise={data.next_7_days.outgoing_paise}
                tone={data.next_7_days.outgoing_paise > 0 ? 'negative' : 'neutral'}
                hint={t('Expected in: {amount}', { amount: formatPaise(data.next_7_days.incoming_paise) })}
                href="/cash-forecast"
              />
            </div>

            {!empty && (
              <>
                <RiskSummaryCard
                  riskState={data.cash_risk.risk_state}
                  lowestBalancePaise={data.cash_risk.lowest_balance_paise}
                  lowestBalanceDate={data.cash_risk.lowest_balance_date}
                  href="/cash-survival-radar"
                />
                <ForecastWidget period={period} onPeriod={setPeriod} state={forecast} />
              </>
            )}

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{t('What should I do today?')}</CardTitle>
                <Button asChild variant="link" size="sm"><Link href="/action-centre">{t('See all')}</Link></Button>
              </CardHeader>
              <CardContent className="p-0">
                {data.priority_actions.length === 0 ? (
                  <p className="px-5 pb-5 text-sm text-muted-foreground">{t('Nothing urgent right now.')}</p>
                ) : (
                  <ul className="divide-y">
                    {data.priority_actions.map((a) => {
                      const extra = a as typeof a & { hi?: Hi; customer_id?: string | null; alert_type?: string };
                      const text =
                        language === 'hindi' && extra.hi
                          ? extra.hi
                          : { title: a.title, why_it_matters: a.why_it_matters, recommended_action: a.action };
                      const action = directAction({
                        sourceRecordType: a.source_type,
                        sourceRecordId: a.source_id,
                        customerId: extra.customer_id,
                        alertType: extra.alert_type,
                      });
                      return (
                        <li key={`${a.source_type}-${a.source_id}`} className="px-5 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{text.title}</p>
                              <p className="text-xs text-muted-foreground">{text.why_it_matters}</p>
                              <p className="mt-1 text-xs">{text.recommended_action}</p>
                            </div>
                            {a.amount_paise > 0 && <AmountDisplay paise={a.amount_paise} />}
                          </div>
                          {action && (
                            <Button asChild size="sm" variant="secondary" className="mt-2">
                              <Link href={action.href}>{t(action.label)}</Link>
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle>{t('Coming up in 7 days')}</CardTitle></CardHeader>
                <CardContent className="p-0"><ScheduleList items={data.next_7_days.schedule} /></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>{t('Recent activity')}</CardTitle></CardHeader>
                <CardContent className="divide-y p-0">
                  {data.recent_activity.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('No money has moved yet.')}</p>}
                  {(data.recent_activity as unknown as Activity[]).map((a) => (
                    <TransactionListRow
                      key={`${a.type}-${a.source_type}-${a.source_id}-${a.date}`}
                      title={activityTitle(a, t)}
                      subtitle={formatDate(a.date)}
                      amountPaise={a.amount_paise}
                      direction={a.type === 'inflow' ? 'in' : a.type === 'outflow' || a.type === 'reversal' ? 'out' : 'neutral'}
                      href={a.href ?? undefined}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('Forecast figures are estimates from the dates you entered.')} {t('Last updated {date}', { date: new Date(data.calculated_at).toLocaleString('en-IN') })}
            </p>
            <ConfirmDialog
              open={askSample}
              onOpenChange={setAskSample}
              title={t('Load sample data?')}
              description={t('This adds made-up customers, bills and expenses so you can look around. They are marked "Sample". Only do this to try the app.')}
              confirmLabel={t('Load sample data')}
              loading={loadingSample}
              onConfirm={loadSample}
            />
          </div>
        )}
      </DataState>
    </>
  );
}

/** The signed-in home screen. `/` shows this to signed-in users and the landing page to everyone else. */
export function DashboardView() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
