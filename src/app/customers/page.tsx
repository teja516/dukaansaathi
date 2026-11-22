'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { getCustomers } from '@/lib/api';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { CustomerRow } from '@/components/CustomerRow';
import { EmptyState } from '@/components/EmptyState';
import { NativeSelect } from '@/components/NativeSelect';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Filter = 'all' | 'outstanding' | 'overdue';
type Sort = 'highest_outstanding' | 'oldest_due' | 'name';

function CustomerList() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('filter');
  const [filter, setFilter] = useState<Filter>(initial === 'overdue' || initial === 'outstanding' ? initial : 'all');
  const [sort, setSort] = useState<Sort>('highest_outstanding');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(id);
  }, [q]);

  const { data, error, loading, reload } = useAsync(
    () => getCustomers({ q: debounced || undefined, filter, sort, limit: 100 }),
    [debounced, filter, sort],
  );

  const chips: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'outstanding', label: 'Owes money' },
    { value: 'overdue', label: 'Overdue' },
  ];

  return (
    <>
      <PageHeader
        title={t('Customers')}
        description={t('People who buy on credit (udhaar).')}
        actions={
          <Button asChild>
            <Link href="/customers/new"><Plus className="h-4 w-4" /> {t('Add customer')}</Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder={t('Search by name or phone')} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Search customers')} />
        </div>
        <NativeSelect className="sm:w-56" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label={t('Sort')}>
          <option value="highest_outstanding">{t('Highest outstanding')}</option>
          <option value="oldest_due">{t('Oldest unpaid first')}</option>
          <option value="name">{t('Name (A–Z)')}</option>
        </NativeSelect>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label={t('Filter')}>
        {chips.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-pressed={filter === c.value}
            onClick={() => {
              setFilter(c.value);
              router.replace(c.value === 'all' ? '/customers' : `/customers?filter=${c.value}`);
            }}
            className={cn('rounded-full border px-3.5 py-2 text-sm', filter === c.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}
          >
            {t(c.label)}
          </button>
        ))}
      </div>
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 ? (
          <EmptyState
            title={debounced || filter !== 'all' ? t('No customers match') : t('No customers yet')}
            description={debounced || filter !== 'all' ? t('Try a different search or filter.') : t('Add your first customer to start tracking udhaar.')}
            action={!debounced && filter === 'all' ? <Button asChild><Link href="/customers/new">{t('Add customer')}</Link></Button> : undefined}
          />
        ) : (
          <Card className="divide-y overflow-hidden p-0">
            {data?.items.map((c) => <CustomerRow key={c.id} customer={c} />)}
          </Card>
        )}
      </DataState>
    </>
  );
}

export default function CustomersPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <CustomerList />
      </Suspense>
    </AppShell>
  );
}
