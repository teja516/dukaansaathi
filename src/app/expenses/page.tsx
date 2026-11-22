'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { getExpenses } from '@/lib/api';
import type { Expens } from '@/types/expens';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { EmptyState } from '@/components/EmptyState';
import { NativeSelect } from '@/components/NativeSelect';
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionListRow } from '@/components/TransactionListRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate, todayIST } from '@/lib/utils';

type Status = 'all' | 'unpaid' | 'paid' | 'cancelled';
type Category = 'all' | 'rent' | 'electricity' | 'wages' | 'transport' | 'other';

const CATEGORY_LABELS: Record<string, string> = {
  rent: 'Rent',
  electricity: 'Electricity',
  wages: 'Wages',
  transport: 'Transport',
  other: 'Other',
};

function ExpenseList() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>('all');
  const [category, setCategory] = useState<Category>('all');
  const { data, error, loading, reload } = useAsync(
    () => getExpenses({ ...(status !== 'all' ? { status } : {}), ...(category !== 'all' ? { category } : {}) }),
    [status, category],
  );
  const today = todayIST();

  const row = (e: Expens) => (
    <TransactionListRow
      key={e.id}
      title={`${e.description || t(CATEGORY_LABELS[e.category] ?? e.category)}${e.isSample ? ` (${t('Sample')})` : ''}`}
      subtitle={`${t(CATEGORY_LABELS[e.category] ?? e.category)} · ${e.status === 'paid' ? t('Paid {date}', { date: formatDate(e.paymentDate) }) : e.dueDate ? t('Due {date}', { date: formatDate(e.dueDate) }) : formatDate(e.expenseDate)}`}
      amountPaise={e.amountPaise}
      direction={e.status === 'paid' ? 'out' : 'neutral'}
      badge={<StatusBadge status={e.status === 'unpaid' && e.dueDate && e.dueDate < today ? 'overdue' : e.status} />}
      href={`/expenses/${e.id}`}
    />
  );

  // With no status filter, keep money still to be paid apart from history (spec Screen 9).
  const upcoming = (data ?? []).filter((e) => e.status === 'unpaid').sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
  const history = (data ?? []).filter((e) => e.status !== 'unpaid');

  return (
    <>
      <PageHeader title={t('Expenses')} description={t('Rent, electricity, wages and other shop costs.')} actions={<Button asChild><Link href="/expenses/new"><Plus className="h-4 w-4" /> {t('Add expense')}</Link></Button>} />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('Filter')}>
          {(['all', 'unpaid', 'paid', 'cancelled'] as const).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={cn('rounded-full border px-3.5 py-2 text-sm', status === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
              {s === 'all' ? t('All') : t(s === 'unpaid' ? 'Unpaid' : s === 'paid' ? 'Paid' : 'Cancelled')}
            </button>
          ))}
        </div>
        <NativeSelect className="sm:ml-auto sm:w-48" value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label={t('Category')}>
          <option value="all">{t('All categories')}</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
        </NativeSelect>
      </div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && data.length === 0 ? (
          <EmptyState title={t('No expenses')} description={t('Record your costs so they show up in your cash forecast.')} action={<Button asChild><Link href="/expenses/new">{t('Add expense')}</Link></Button>} />
        ) : status === 'all' ? (
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>{t('Upcoming: not paid yet')}</CardTitle></CardHeader>
              <CardContent className="divide-y p-0">
                {upcoming.length === 0 ? <p className="px-5 pb-5 text-sm text-muted-foreground">{t('Nothing is waiting to be paid.')}</p> : upcoming.map(row)}
              </CardContent>
            </Card>
            {history.length > 0 && (
              <Card>
                <CardHeader><CardTitle>{t('History: paid and cancelled')}</CardTitle></CardHeader>
                <CardContent className="divide-y p-0">{history.map(row)}</CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="divide-y overflow-hidden p-0">{data?.map(row)}</Card>
        )}
      </DataState>
    </>
  );
}

export default function ExpensesPage() {
  return (
    <AppShell>
      <ExpenseList />
    </AppShell>
  );
}
