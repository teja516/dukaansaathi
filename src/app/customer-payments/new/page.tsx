'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { getCustomers, getCustomerById, getCustomerPaymentPreview, createCustomerPayment } from '@/lib/api';
import { errorMessage, formatDate, formatPaise, newIdempotencyKey, rupeesToPaise, todayIST } from '@/lib/utils';
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
import { PaymentPreviewCard } from '@/components/PaymentPreviewCard';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Method = 'cash' | 'upi' | 'bank';

function Form() {
  const { t } = useLanguage();
  const router = useRouter();
  const sp = useSearchParams();
  const customers = useAsync(() => getCustomers({ filter: 'outstanding', limit: 200, sort: 'name' }), []);
  const [customerId, setCustomerId] = useState(sp.get('customer_id') ?? '');
  const [creditId, setCreditId] = useState(sp.get('credit_transaction_id') ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIST());
  const [method, setMethod] = useState<Method>('cash');
  const [note, setNote] = useState('');
  const [key] = useState(newIdempotencyKey);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(amount !== '' || note !== '');
  const recent = useRecentIds('customers');
  const [review, setReview] = useState(false);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getCustomerPaymentPreview>> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const detail = useAsync(() => (customerId ? getCustomerById(customerId) : Promise.resolve(null)), [customerId]);
  const paise = amount === '' ? null : rupeesToPaise(amount);

  // Live "before / after" preview; stale responses are ignored.
  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
    if (!customerId || paise === null || paise <= 0) return;
    let cancelled = false;
    const id = setTimeout(() => {
      getCustomerPaymentPreview({ customer_id: customerId, credit_transaction_id: creditId || undefined, amount_paise: paise })
        .then((p) => !cancelled && setPreview(p))
        .catch((err) => !cancelled && setPreviewError(errorMessage(err)));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [customerId, creditId, paise]);

  const valid = customerId && paise !== null && paise > 0 && !previewError && preview && date <= todayIST();

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
      await createCustomerPayment({
        customerId,
        creditTransactionId: creditId || undefined,
        amountPaise: paise,
        paymentDate: date,
        paymentMethod: method,
        note: note.trim() || null,
        idempotencyKey: key,
      });
      recent.remember(customerId);
      router.replace(`/customers/${customerId}`);
    } catch (err) {
      setError(errorMessage(err));
      setReview(false);
      setBusy(false);
    }
  }

  const methods: { value: Method; label: string }[] = [
    { value: 'cash', label: 'Cash' },
    { value: 'upi', label: 'UPI' },
    { value: 'bank', label: 'Bank' },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Record payment')} description={t('Money received from a customer.')} backHref={customerId ? `/customers/${customerId}` : '/customers'} backLabel={t('Back')} />
      <DataState loading={customers.loading} error={customers.error} onRetry={customers.reload}>
        <Card className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <FormField label={t('Customer')} htmlFor="customer" required>
              <NativeSelect
                id="customer"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setCreditId('');
                }}
              >
                <option value="">{t('Choose a customer')}</option>
                {customers.data?.items.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {formatPaise(c.outstanding_paise)}</option>
                ))}
              </NativeSelect>
            </FormField>
            <RecentPicks recentIds={recent.ids} options={customers.data?.items ?? []} value={customerId} onPick={(id) => { setCustomerId(id); setCreditId(''); }} />
            {customers.data?.items.length === 0 && <p className="text-sm text-muted-foreground">{t('No customer owes you money right now.')}</p>}

            {customerId && detail.data && (
              <FormField label={t('Which credit?')} htmlFor="credit" helper={t('Leave on automatic to apply the payment to the oldest credit first.')}>
                <NativeSelect id="credit" value={creditId} onChange={(e) => setCreditId(e.target.value)}>
                  <option value="">{t('Oldest first (automatic)')}</option>
                  {detail.data.unpaid_credit_transactions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatDate(c.transaction_date)} — {t('{amount} left', { amount: formatPaise(c.remaining_amount_paise) })}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            )}

            <FormField label={t('Amount received')} htmlFor="amount" error={amount !== '' && (paise === null || paise <= 0) ? t('Enter an amount greater than zero') : previewError} required>
              <MoneyInput id="amount" value={amount} onValueChange={setAmount} placeholder="0" />
            </FormField>

            {preview && paise !== null && (
              <PaymentPreviewCard mode="receive" beforePaise={preview.outstanding_before_paise} amountPaise={preview.received_paise} afterPaise={preview.outstanding_after_paise} />
            )}

            <FormField label={t('Date received')} htmlFor="date" error={date > todayIST() ? t('Date cannot be in the future') : null} required>
              <Input id="date" type="date" max={todayIST()} value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">{t('How was it paid?')}</legend>
              <div className="grid grid-cols-3 gap-2">
                {methods.map((m) => (
                  <label key={m.value} className={cn('flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium', method === m.value ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
                    <input type="radio" name="method" className="sr-only" checked={method === m.value} onChange={() => setMethod(m.value)} />
                    {t(m.label)}
                  </label>
                ))}
              </div>
            </fieldset>

            <FormField label={t('Note (optional)')} htmlFor="note">
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            </FormField>
            <Button type="submit" disabled={busy || !valid}>{busy ? t('Saving…') : t('Save payment')}</Button>
          </form>
          <ReviewDialog
            open={review}
            onOpenChange={setReview}
            busy={busy}
            onConfirm={save}
            rows={[
              { label: t('Customer'), value: customers.data?.items.find((c) => c.id === customerId)?.name ?? '' },
              { label: t('Amount received'), value: formatPaise(paise ?? 0) },
              { label: t('Date received'), value: formatDate(date) },
              { label: t('How was it paid?'), value: t(method === 'cash' ? 'Cash' : method === 'upi' ? 'UPI' : 'Bank') },
            ]}
            note={preview ? t('{amount} will be received; {left} will remain on this credit.', { amount: formatPaise(preview.received_paise), left: formatPaise(preview.outstanding_after_paise) }) : undefined}
          />
        </Card>
      </DataState>
    </div>
  );
}

export default function NewCustomerPaymentPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </AppShell>
  );
}
