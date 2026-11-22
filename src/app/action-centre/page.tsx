'use client';
import { useState } from 'react';
import { getAlerts, createAlertReview, createAlertTakeAction } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { EmptyState } from '@/components/EmptyState';
import { AlertCard, type AlertData } from '@/components/AlertCard';
import { cn } from '@/lib/utils';

type Category = 'all' | 'collections' | 'supplier' | 'expenses' | 'cash_risk';

const TABS: { v: Category; l: string }[] = [
  { v: 'all', l: 'All' },
  { v: 'collections', l: 'Collections' },
  { v: 'supplier', l: 'Suppliers' },
  { v: 'expenses', l: 'Expenses' },
  { v: 'cash_risk', l: 'Cash risk' },
];

/** One-glance summary at the top: how many things need attention and which comes first. */
function Summary({ items }: { items: AlertData[] }) {
  const { t, language } = useLanguage();
  const count = (c: string) => items.filter((i) => i.filterCategory === c).length;
  const first = items[0];
  const firstText = language === 'hindi' && first.hi ? first.hi.title : first.title;
  const parts = [
    ['collections', 'Collections'],
    ['supplier', 'Suppliers'],
    ['expenses', 'Expenses'],
    ['cash_risk', 'Cash risk'],
  ] as const;
  return (
    <div className="mb-4 rounded-lg border bg-card p-4" role="status">
      <p className="font-heading font-semibold">{t('{n} things need your attention', { n: items.length })}</p>
      <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
        {parts.filter(([k]) => count(k) > 0).map(([k, l]) => (
          <span key={k}>{t(l)}: {count(k)}</span>
        ))}
      </p>
      {firstText && <p className="mt-2 text-sm">{t('Start with')}: <span className="font-medium">{firstText}</span></p>}
    </div>
  );
}

function ActionCentre() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<Category>('all');
  const [showDone, setShowDone] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const { data, error, loading, reload } = useAsync(
    () => getAlerts({ ...(category !== 'all' ? { filter_category: category } : {}), ...(showDone ? { status: 'action_taken' as const } : {}), limit: 100 }),
    [category, showDone],
  );

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader title={t('Action Centre')} description={t('A short, ordered list of what needs your attention.')} />
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label={t('Filter')}>
        {TABS.map((tab) => (
          <button key={tab.v} type="button" aria-pressed={category === tab.v} onClick={() => setCategory(tab.v)} className={cn('rounded-full border px-3.5 py-2 text-sm', category === tab.v ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
            {t(tab.l)}
          </button>
        ))}
        <button type="button" aria-pressed={showDone} onClick={() => setShowDone((v) => !v)} className={cn('ml-auto rounded-full border px-3.5 py-2 text-sm', showDone ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
          {t('Done')}
        </button>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{t('Marking an alert reviewed does not change any money records. Alerts clear on their own once the problem is gone.')}</p>
      {actionError && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
      {data && data.items.length > 0 && !showDone && <Summary items={data.items as unknown as AlertData[]} />}
      <DataState loading={loading} error={error} onRetry={reload}>
        {data && data.items.length === 0 ? (
          <EmptyState title={showDone ? t('Nothing marked done yet') : t('All clear')} description={showDone ? undefined : t('Nothing needs your attention right now.')} />
        ) : (
          <div className="space-y-3">
            {data?.items.map((a) => (
              <AlertCard
                key={a.id}
                alert={a as unknown as AlertData}
                busy={busyId === a.id}
                onReview={(id) => act(id, () => createAlertReview(id, {}))}
                onTakeAction={(id, note) => act(id, () => createAlertTakeAction(id, { action_note: note.trim() || undefined }))}
              />
            ))}
          </div>
        )}
      </DataState>
    </>
  );
}

export default function ActionCentrePage() {
  return (
    <AppShell>
      <ActionCentre />
    </AppShell>
  );
}
