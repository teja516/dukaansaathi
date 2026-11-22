'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { getSuppliers, createSupplierBill } from '@/lib/api';
import { addDays, errorMessage, formatDate, formatPaise, rupeesToPaise, todayIST } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { useRecentIds } from '@/hooks/useRecentIds';
import { RecentPicks } from '@/components/RecentPicks';
import { ReviewDialog } from '@/components/ReviewDialog';
import { DataState } from '@/components/DataState';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';

import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


function Form() {
  const { t } = useLanguage();
  const router = useRouter();
  const preset = useSearchParams().get('supplier_id') ?? '';
  const suppliers = useAsync(() => getSuppliers({ limit: 200, sort: 'name' }), []);
  const [supplierId, setSupplierId] = useState(preset);
  const [amount, setAmount] = useState('');
  const [billDate, setBillDate] = useState(todayIST());
  const [dueDate, setDueDate] = useState(addDays(todayIST(), 15));
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(amount !== '' || reference !== '');
  const recent = useRecentIds('suppliers');
  const [review, setReview] = useState(false);

  const paise = amount === '' ? null : rupeesToPaise(amount);
  const dateError = dueDate < billDate ? t('Due date cannot be before the bill date') : null;
  const valid = supplierId && paise !== null && paise > 0 && dueDate && !dateError;

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
      await createSupplierBill({ supplierId, amountPaise: paise, billDate, dueDate, reference: reference.trim() || null });
      recent.remember(supplierId);
      router.replace(`/suppliers/${supplierId}`);
    } catch (err) {
      setError(errorMessage(err));
      setReview(false);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Add supplier bill')} backHref={preset ? `/suppliers/${preset}` : '/suppliers'} backLabel={t('Back')} />
      <DataState loading={suppliers.loading} error={suppliers.error} onRetry={suppliers.reload}>
        <Card className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <FormField label={t('Supplier')} htmlFor="supplier" required>
              <NativeSelect id="supplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">{t('Choose a supplier')}</option>
                {suppliers.data?.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </NativeSelect>
            </FormField>
            <RecentPicks recentIds={recent.ids} options={suppliers.data?.items ?? []} value={supplierId} onPick={setSupplierId} />
            {suppliers.data?.items.length === 0 && <p className="text-sm text-muted-foreground">{t('No suppliers yet.')} <Link href="/suppliers/new" className="text-primary hover:underline">{t('Add one first')}</Link></p>}
            <FormField label={t('Bill amount')} htmlFor="amount" error={amount !== '' && (paise === null || paise <= 0) ? t('Enter an amount greater than zero') : null} required>
              <MoneyInput id="amount" value={amount} onValueChange={setAmount} placeholder="0" />
            </FormField>
            <FormField label={t('Bill date')} htmlFor="billDate" required>
              <Input id="billDate" type="date" max={todayIST()} value={billDate} onChange={(e) => setBillDate(e.target.value)} />
            </FormField>
            <FormField label={t('Due date')} htmlFor="dueDate" error={dateError} required>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
            <FormField label={t('Bill number / note (optional)')} htmlFor="ref">
              <Input id="ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} />
            </FormField>
            <Button type="submit" disabled={busy || !valid}>{busy ? t('Saving…') : t('Save bill')}</Button>
          </form>
          <ReviewDialog
            open={review}
            onOpenChange={setReview}
            busy={busy}
            onConfirm={save}
            rows={[
              { label: t('Supplier'), value: suppliers.data?.items.find((s) => s.id === supplierId)?.name ?? '' },
              { label: t('Bill amount'), value: formatPaise(paise ?? 0) },
              { label: t('Bill date'), value: formatDate(billDate) },
              { label: t('Due date'), value: formatDate(dueDate) },
              ...(reference.trim() ? [{ label: t('Bill number / note'), value: reference.trim() }] : []),
            ]}
            note={t('The bill stays unpaid until you record a payment.')}
          />
        </Card>
      </DataState>
    </div>
  );
}

export default function NewSupplierBillPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </AppShell>
  );
}
