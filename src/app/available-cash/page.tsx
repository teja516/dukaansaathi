'use client';
import { getAvailableCash } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { AmountDisplay } from '@/components/AmountDisplay';
import { MetricCard } from '@/components/MetricCard';
import { TransactionListRow } from '@/components/TransactionListRow';
import { EmptyState } from '@/components/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AvailableCash() {
  const { t } = useLanguage();
  const { data, error, loading, reload } = useAsync(() => getAvailableCash({ limit: 30 }), []);
  return (
    <>
      <PageHeader title={t('Available Cash')} description={t('Money you actually have: opening balance + received − paid.')} />
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="space-y-6">
            <Card className="bg-primary p-6 text-primary-foreground">
              <p className="text-sm opacity-90">{t('Total available')}</p>
              <AmountDisplay paise={data.available_paise} size="xl" className="!text-primary-foreground" />
            </Card>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard label={t('Cash in hand')} paise={data.cash_in_hand_paise} hint={t('Opening {amount}', { amount: `₹${(data.opening_cash_paise / 100).toLocaleString('en-IN')}` })} />
              <MetricCard label={t('Bank / UPI')} paise={data.bank_upi_paise} hint={t('Opening {amount}', { amount: `₹${(data.opening_bank_upi_paise / 100).toLocaleString('en-IN')}` })} />
            </div>
            <p className="text-xs text-muted-foreground">{t('This is a combined business balance from the entries you recorded. It is not a bank reconciliation.')}</p>
            <Card>
              <CardHeader><CardTitle>{t('Recent money in and out')}</CardTitle></CardHeader>
              <CardContent className="divide-y p-0">
                {data.recent_movements.length === 0 ? (
                  <div className="p-5"><EmptyState title={t('No money has moved yet')} description={t('Payments you record will appear here.')} /></div>
                ) : (
                  data.recent_movements.map((m) => (
                    <TransactionListRow
                      key={m.id}
                      title={`${m.source_type === 'customer_payment' ? t('Received from customer') : m.source_type === 'supplier_payment' ? t('Paid to supplier') : t('Expense paid')}${(m as { party?: string | null }).party ? ` · ${(m as { party?: string | null }).party}` : ''}`}
                      subtitle={`${formatDate(m.movement_date)} · ${m.payment_method.toUpperCase()}`}
                      amountPaise={m.amount_paise}
                      direction={m.direction === 'inflow' ? 'in' : 'out'}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </>
  );
}

export default function AvailableCashPage() {
  return (
    <AppShell>
      <AvailableCash />
    </AppShell>
  );
}
