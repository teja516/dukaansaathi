'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { getSuppliers, getSupplierBills, getSupplierBillById, getSupplierPaymentPreview, createSupplierPayment } from '@/lib/api';
import { cn, errorMessage, formatDate, formatPaise, newIdempotencyKey, rupeesToPaise, todayIST } from '@/lib/utils';
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
import { PaymentPreviewCard } from '@/components/PaymentPreviewCard';

import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


type Method = 'cash' | 'upi' | 'bank';

function Form() {
  const { t } = useLanguage();
  const router = useRouter();
  const sp = useSearchParams();
  const presetBill = sp.get('supplier_bill_id') ?? '';
  const [supplierId, setSupplierId] = useState(sp.get('supplier_id') ?? '');
  const [billId, setBillId] = useState(presetBill);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayIST());
  const [method, setMethod] = useState<Method>('cash');
  const [note, setNote] = useState('');
  const [key] = useState(newIdempotencyKey);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(amount !== '' || note !== '');
  const recent = useRecentIds('suppliers');
  const [review, setReview] = useState(false);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof getSupplierPaymentPreview>> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const suppliers = useAsync(() => getSuppliers({ limit: 200, sort: 'name' }), []);
  const bills = useAsync(
    () => (supplierId ? getSupplierBills({ supplier_id: supplierId }) : Promise.resolve([])),
    [supplierId],
  );
  const openBills = (bills.data ?? []).filter((b) => b.remaining_amount_paise > 0);

  // Arriving from a bill: work out which supplier it belongs to.
  useEffect(() => {
    if (!presetBill || supplierId) return;
    getSupplierBillById(presetBill).then((r) => setSupplierId(r.bill.supplierId)).catch((err) => setError(errorMessage(err)));
  }, [presetBill, supplierId]);

  const paise = amount === '' ? null : rupeesToPaise(amount);

  useEffect(() => {
    setPreview(null);
    setPreviewError(null);
    if (!supplierId || paise === null || paise <= 0) return;
    let cancelled = false;
    const id = setTimeout(() => {
      getSupplierPaymentPreview({ supplier_id: supplierId, supplier_bill_id: billId || undefined, amount_paise: paise })
        .then((p) => !cancelled && setPreview(p))
        .catch((err) => !cancelled && setPreviewError(errorMessage(err)));
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [supplierId, billId, paise]);

  const valid = supplierId && paise !== null && paise > 0 && preview && !previewError && date <= todayIST();

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
      await createSupplierPayment({ supplierId, supplierBillId: billId || undefined, amountPaise: paise, paymentDate: date, paymentMethod: method, note: note.trim() || null, idempotencyKey: key });
      recent.remember(supplierId);
      router.replace(billId ? `/supplier-bills/${billId}` : `/suppliers/${supplierId}`);
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
      <PageHeader title={t('Pay supplier')} description={t('Record money you paid against a bill.')} backHref={supplierId ? `/suppliers/${supplierId}` : '/suppliers'} backLabel={t('Back')} />
      <DataState loading={suppliers.loading} error={suppliers.error} onRetry={suppliers.reload}>
        <Card className="p-5">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <FormField label={t('Supplier')} htmlFor="supplier" required>
              <NativeSelect id="supplier" value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setBillId(''); }}>
                <option value="">{t('Choose a supplier')}</option>
                {suppliers.data?.items.map((s) => <option key={s.id} value={s.id}>{s.name} — {formatPaise(s.payable_paise)}</option>)}
              </NativeSelect>
            </FormField>
            <RecentPicks recentIds={recent.ids} options={suppliers.data?.items ?? []} value={supplierId} onPick={(id) => { setSupplierId(id); setBillId(''); }} />
            {supplierId && (
              <FormField label={t('Which bill?')} htmlFor="bill" helper={t('Leave on automatic to pay the bill that is due first.')}>
                <NativeSelect id="bill" value={billId} onChange={(e) => setBillId(e.target.value)}>
                  <option value="">{t('Oldest due first (automatic)')}</option>
                  {openBills.map((b) => <option key={b.id} value={b.id}>{formatDate(b.due_date)} — {t('{amount} left', { amount: formatPaise(b.remaining_amount_paise) })}</option>)}
                </NativeSelect>
              </FormField>
            )}
            {supplierId && !bills.loading && openBills.length === 0 && <p className="text-sm text-muted-foreground">{t('This supplier has no unpaid bills.')}</p>}
            <FormField label={t('Amount paid')} htmlFor="amount" error={amount !== '' && (paise === null || paise <= 0) ? t('Enter an amount greater than zero') : previewError} required>
              <MoneyInput id="amount" value={amount} onValueChange={setAmount} placeholder="0" />
            </FormField>
            {preview && (
              <PaymentPreviewCard mode="pay" beforePaise={preview.remaining_before_paise} amountPaise={preview.paid_paise} afterPaise={preview.remaining_after_paise} />
            )}
            <FormField label={t('Date paid')} htmlFor="date" error={date > todayIST() ? t('Date cannot be in the future') : null} required>
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
            <FormField label={t('Note (optional)')} htmlFor="note"><Input id="note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} /></FormField>
            <Button type="submit" disabled={busy || !valid}>{busy ? t('Saving…') : t('Save payment')}</Button>
          </form>
          <ReviewDialog
            open={review}
            onOpenChange={setReview}
            busy={busy}
            onConfirm={save}
            rows={[
              { label: t('Supplier'), value: suppliers.data?.items.find((s) => s.id === supplierId)?.name ?? '' },
              { label: t('Which bill?'), value: billId ? (openBills.find((b) => b.id === billId) ? formatDate(openBills.find((b) => b.id === billId)!.due_date) : '') : t('Oldest due first (automatic)') },
              { label: t('Amount paid'), value: formatPaise(paise ?? 0) },
              { label: t('Date paid'), value: formatDate(date) },
              { label: t('How was it paid?'), value: t(method === 'cash' ? 'Cash' : method === 'upi' ? 'UPI' : 'Bank') },
            ]}
            note={preview ? t('{amount} will be paid; {left} will remain on this bill.', { amount: formatPaise(preview.paid_paise), left: formatPaise(preview.remaining_after_paise) }) : undefined}
          />
        </Card>
      </DataState>
    </div>
  );
}

export default function NewSupplierPaymentPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <Form />
      </Suspense>
    </AppShell>
  );
}
