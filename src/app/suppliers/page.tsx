'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { getSuppliers } from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { EmptyState } from '@/components/EmptyState';
import { NativeSelect } from '@/components/NativeSelect';
import { AmountDisplay } from '@/components/AmountDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { SampleBadge } from '@/components/SampleBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';

type Filter = 'all' | 'overdue';
type Sort = 'highest_payable' | 'nearest_due' | 'name';

function SupplierList() {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('highest_payable');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);
  const { data, error, loading, reload } = useAsync(() => getSuppliers({ q: debounced || undefined, filter, sort, limit: 100 }), [debounced, filter, sort]);

  return (
    <>
      <PageHeader
        title={t('Suppliers')}
        description={t('Wholesalers and distributors you owe money to.')}
        actions={
          <>
            <Button asChild variant="outline"><Link href="/supplier-bills">{t('All bills')}</Link></Button>
            <Button asChild><Link href="/suppliers/new"><Plus className="h-4 w-4" /> {t('Add supplier')}</Link></Button>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder={t('Search by name or phone')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search suppliers')} />
        </div>
        <NativeSelect className="sm:w-56" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t('Sort')}>
          <option value="highest_payable">{t('Highest payable')}</option>
          <option value="nearest_due">{t('Nearest due date')}</option>
          <option value="name">{t('Name (A–Z)')}</option>
        </NativeSelect>
      </div>
      <div className="mb-4 flex gap-2" role="group" aria-label={t('Filter')}>
        {(['all', 'overdue'] as const).map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn('rounded-full border px-3.5 py-2 text-sm', filter === f ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
            {f === 'all' ? t('All') : t('Overdue')}
          </button>
        ))}
      </div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 ? (
          <EmptyState
            title={debounced || filter !== 'all' ? t('No suppliers match') : t('No suppliers yet')}
            description={t('Add a supplier, then record their bills to see what you owe.')}
            action={!debounced && filter === 'all' ? <Button asChild><Link href="/suppliers/new">{t('Add supplier')}</Link></Button> : undefined}
          />
        ) : (
          <Card className="divide-y overflow-hidden p-0">
            {data?.items.map((s) => (
              <Link key={s.id} href={`/suppliers/${s.id}`} prefetch={false} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/40">
                <Avatar><AvatarFallback>{s.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{s.name}{(s as { is_sample?: boolean }).is_sample && <SampleBadge />}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.nearest_unpaid_due_date ? t('Next due {date}', { date: formatDate(s.nearest_unpaid_due_date) }) : t('Nothing due')}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <AmountDisplay paise={s.payable_paise} tone={s.is_overdue ? 'negative' : 'neutral'} />
                  {s.is_overdue && <StatusBadge status="overdue" />}
                </div>
              </Link>
            ))}
          </Card>
        )}
      </DataState>
    </>
  );
}

export default function SuppliersPage() {
  return (
    <AppShell>
      <SupplierList />
    </AppShell>
  );
}
