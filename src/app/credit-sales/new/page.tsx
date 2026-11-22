'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { getCustomers, createCreditTransaction } from '@/lib/api';
import { errorMessage, formatDate, formatPaise, rupeesToPaise, todayIST } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { useRecentIds } from '@/hooks/useRecentIds';
import { RecentPicks } from '@/components/RecentPicks';
import { ReviewDialog } from '@/components/ReviewDialog';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { FormField } from '@/components/FormField';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function Form() {
  const { t } = useLanguage();
  const router = useRouter();
  const preset = useSearchParams().get('customer_id') ?? '';
  const customers = useAsync(() => getCustomers({ limit: 200, sort: 'name' }), []);
  const [customerId, setCustomerId] = useState(preset);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIST());
  const [expected, setExpected] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(amount !== '' || expected !== '' || description !== '');
  const recent = useRecentIds('customers');
  const [review, setReview] = useState(false);

  const paise = amount === '' ? null : rupeesToPaise(amount);
  const amountError = amount !== '' && (paise === null || paise <= 0) ? t('Enter an amount greater than zero') : null;
  const dateError = expected && expected < date ? t('Expected date cannot be before the sale date') : null;
  const valid = customerId && paise !== null && paise > 0 && !dateError;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || !valid || paise === null) return;
    setReview(true);
  }

  async function save() {
    if (busy || !valid || paise === null) return;
    setBusy(true);
    setError(null);
    try {
      await createCreditTransaction({
        customerId,
        amountPaise: paise,
        transactionDate: date,
        expectedPaymentDate: expected || null,
        description: description.trim() || null,
      });
      recent.remember(customerId);
      router.replace(`/customers/${customerId}`);
    } catch (err) {
      setError(errorMessage(err));
      setReview(false);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Add credit')} description={t('Record goods given on udhaar.')} backHref={preset ? `/customers/${preset}` : '/customers'} backLabel={t('Back')} />
      <DataState loading={customers.loading} error={customers.error} onRetry={customers.reload}>
        <Card className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <FormField label={t('Customer')} htmlFor="customer" required>
              <NativeSelect id="customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">{t('Choose a customer')}</option>
                {customers.data?.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </NativeSelect>
            </FormField>
            <RecentPicks recentIds={recent.ids} options={customers.data?.items ?? []} value={customerId} onPick={setCustomerId} />
            {customers.data?.items.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('No customers yet.')} <Link href="/customers/new" className="text-primary hover:underline">{t('Add one first')}</Link></p>
            )}
            <FormField label={t('Amount')} htmlFor="amount" error={amountError} required>
              <MoneyInput id="amount" value={amount} onValueChange={setAmount} placeholder="0" />
            </FormField>
            <FormField label={t('Date of sale')} htmlFor="date" required>
              <Input id="date" type="date" max={todayIST()} value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
            <FormField label={t('Expected payment date (optional)')} htmlFor="expected" helper={t('Without a date, this credit is left out of the forecast.')} error={dateError}>
              <Input id="expected" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
            </FormField>
            <FormField label={t('What was sold? (optional)')} htmlFor="desc">
              <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
            </FormField>
            <Button type="submit" disabled={busy || !valid}>{busy ? t('Saving…') : t('Save credit')}</Button>
          </form>
          <ReviewDialog
            open={review}
            onOpenChange={setReview}
            busy={busy}
            onConfirm={save}
            rows={[
              { label: t('Customer'), value: customers.data?.items.find((c) => c.id === customerId)?.name ?? '' },
              { label: t('Amount'), value: formatPaise(paise ?? 0) },
              { label: t('Date of sale'), value: formatDate(date) },
              { label: t('Expected payment date'), value: expected ? formatDate(expected) : t('Not known (left out of the forecast)') },
              ...(description.trim() ? [{ label: t('What was sold?'), value: description.trim() }] : []),
            ]}
            note={t('This increases what the customer owes you. It does not add to your cash until they pay.')}
          />
        </Card>
      </DataState>
    </div>
  );
}

export default function NewCreditSalePage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </AppShell>
  );
}
