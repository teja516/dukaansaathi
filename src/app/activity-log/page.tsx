'use client';
import { useState } from 'react';
import { getAuditEvents, type AuditEventItem } from '@/lib/api';
import { errorMessage, formatPaise } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ENTITY: Record<string, string> = {
  customer: 'Customer',
  supplier: 'Supplier',
  credit_transaction: 'Credit',
  customer_payment: 'Customer payment',
  supplier_bill: 'Supplier bill',
  supplier_payment: 'Supplier payment',
  expense: 'Expense',
  shop: 'Shop settings',
};

const ACTION: Record<string, string> = {
  create: 'Added',
  update: 'Changed',
  delete: 'Deleted',
  reverse: 'Reversed',
  mark_paid: 'Marked as paid',
  cancel: 'Cancelled',
  complete_setup: 'Finished setup',
  load_sample_data: 'Loaded sample data',
};

const FIELD: Record<string, string> = {
  name: 'Name',
  phoneNumber: 'Phone number',
  notes: 'Notes',
  amountPaise: 'Amount',
  remainingAmountPaise: 'Amount left',
  transactionDate: 'Date of sale',
  expectedPaymentDate: 'Expected payment date',
  description: 'Description',
  billDate: 'Bill date',
  dueDate: 'Due date',
  reference: 'Bill number / note',
  category: 'Category',
  expenseDate: 'Expense date',
  shopName: 'Shop name',
  ownerName: 'Owner name',
  cashSafetyThresholdPaise: 'Cash safety amount',
  openingCashBalancePaise: 'Opening cash',
  openingBankBalancePaise: 'Opening bank / UPI',
  interfaceLanguage: 'Language',
  status: 'Status',
};

function show(key: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number' && key.endsWith('Paise')) return formatPaise(v);
  return String(v);
}

function Event({ e }: { e: AuditEventItem }) {
  const { t, language } = useLanguage();
  const meta = e.metadata;
  const keys = meta?.after ? Object.keys(meta.after).filter((k) => k !== 'status') : [];
  const when = new Date(e.created_at).toLocaleString(language === 'hindi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });
  return (
    <li className="px-5 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-sm font-medium">
          {t(ACTION[e.action_type] ?? e.action_type)} · {t(ENTITY[e.entity_type] ?? e.entity_type)}
        </p>
        <p className="text-xs text-muted-foreground">{when}{e.actor_name ? ` · ${e.actor_name}` : ''}</p>
      </div>
      {keys.length > 0 && meta?.before && meta.after && (
        <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {keys.map((k) => (
            <li key={k}>
              {t(FIELD[k] ?? k)}: <span className="line-through">{show(k, meta.before![k])}</span> → <span className="font-medium text-foreground">{show(k, meta.after![k])}</span>
            </li>
          ))}
        </ul>
      )}
      {meta?.reason && <p className="mt-1 text-xs text-muted-foreground">{t('Reason')}: {meta.reason}</p>}
      {e.action_type === 'create' && typeof meta?.amountPaise === 'number' && <p className="mt-1 text-xs text-muted-foreground">{formatPaise(meta.amountPaise)}</p>}
    </li>
  );
}

function ActivityLog() {
  const { t } = useLanguage();
  const [extra, setExtra] = useState<AuditEventItem[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [moreError, setMoreError] = useState<string | null>(null);
  const { data, error, loading, reload } = useAsync(() => getAuditEvents({ limit: 50 }), []);
  const next = cursor === undefined ? data?.next_cursor : cursor;

  async function loadMore() {
    if (!next) return;
    try {
      const page = await getAuditEvents({ limit: 50, cursor: next });
      setExtra((e) => [...e, ...page.items]);
      setCursor(page.next_cursor);
    } catch (err) {
      setMoreError(errorMessage(err));
    }
  }

  const items = [...(data?.items ?? []), ...extra];
  return (
    <>
      <PageHeader title={t('Activity log')} description={t('A record of what was added, changed or reversed, and by whom.')} backHref="/settings" backLabel={t('Settings')} />
      <DataState loading={loading} error={error} onRetry={reload}>
        {items.length === 0 ? (
          <EmptyState title={t('Nothing recorded yet')} />
        ) : (
          <Card className="overflow-hidden p-0">
            <ul className="divide-y">{items.map((e) => <Event key={e.id} e={e} />)}</ul>
          </Card>
        )}
        {moreError && <p role="alert" className="mt-3 text-sm text-destructive">{moreError}</p>}
        {next && <Button variant="outline" className="mt-4" onClick={loadMore}>{t('Show older')}</Button>}
      </DataState>
    </>
  );
}

export default function ActivityLogPage() {
  return (
    <AppShell>
      <ActivityLog />
    </AppShell>
  );
}
