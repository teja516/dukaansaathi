'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { getSupplierBills } from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { EmptyState } from '@/components/EmptyState';
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionListRow } from '@/components/TransactionListRow';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

type Status = 'all' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue';

function Bills() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<Status>('all');
  const { data, error, loading, reload } = useAsync(() => getSupplierBills(status === 'all' ? {} : { status }), [status]);
  const chips: { v: Status; l: string }[] = [
    { v: 'all', l: 'All' },
    { v: 'unpaid', l: 'Unpaid' },
    { v: 'partially_paid', l: 'Partly paid' },
    { v: 'overdue', l: 'Overdue' },
    { v: 'paid', l: 'Paid' },
  ];
  return (
    <>
      <PageHeader
        title={t('Supplier bills')}
        backHref="/suppliers"
        backLabel={t('Suppliers')}
        actions={<Button asChild><Link href="/supplier-bills/new"><Plus className="h-4 w-4" /> {t('Add supplier bill')}</Link></Button>}
      />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t('Filter')}>
        {chips.map((c) => (
          <button key={c.v} type="button" aria-pressed={status === c.v} onClick={() => setStatus(c.v)} className={cn('rounded-full border px-3.5 py-2 text-sm', status === c.v ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
            {t(c.l)}
          </button>
        ))}
      </div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && data.length === 0 ? (
          <EmptyState title={t('No bills')} description={t('Bills you record from suppliers will appear here.')} action={<Button asChild><Link href="/supplier-bills/new">{t('Add supplier bill')}</Link></Button>} />
        ) : (
          <Card className="divide-y overflow-hidden p-0">
            {data?.map((b) => (
              <TransactionListRow
                key={b.id}
                title={`${b.supplier_name}${(b as { is_sample?: boolean }).is_sample ? ` (${t('Sample')})` : ''}`}
                subtitle={t('Due {date}', { date: formatDate(b.due_date) })}
                amountPaise={b.remaining_amount_paise}
                badge={<StatusBadge status={b.overdue ? 'overdue' : b.status} />}
                href={`/supplier-bills/${b.id}`}
              />
            ))}
          </Card>
        )}
      </DataState>
    </>
  );
}

export default function SupplierBillsPage() {
  return (
    <AppShell>
      <Bills />
    </AppShell>
  );
}
