'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { CalendarClock, HandCoins, Pencil, Trash2, Undo2 } from 'lucide-react';
import { getCreditTransactionById, updateCreditTransaction, deleteCreditTransaction, createCustomerPaymentReverse } from '@/lib/api';
import { errorMessage, formatDate, formatPaise, rupeesToPaise, todayIST } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { AmountDisplay } from '@/components/AmountDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ReversePaymentDialog } from '@/components/ReversePaymentDialog';
import { FormField } from '@/components/FormField';
import { MoneyInput } from '@/components/MoneyInput';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LinkedPayment {
  id: string;
  amount_paise: number;
  payment_amount_paise: number;
  payment_date: string;
  payment_method: string;
  reversed: boolean;
  reversal_reason: string | null;
}

function CreditDetail() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const wantsExpected = useSearchParams().get('edit') === 'expected';
  const { data, error, loading, reload } = useAsync(() => getCreditTransactionById(id), [id]);

  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [expected, setExpected] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reversing, setReversing] = useState<{ id: string; amountPaise: number; date: string } | null>(null);
  const [autoOpened, setAutoOpened] = useState(false);

  const tx = data?.credit_transaction;
  const payments = (data?.linked_payments ?? []) as unknown as LinkedPayment[];
  const paid = tx ? tx.amountPaise - data!.remaining_amount_paise : 0;
  const today = todayIST();
  const notInForecast = !!tx && data!.remaining_amount_paise > 0 && (!tx.expectedPaymentDate || tx.expectedPaymentDate < today);

  function openEdit() {
    if (!tx) return;
    setAmount(String(tx.amountPaise / 100));
    setSaleDate(tx.transactionDate);
    setExpected(tx.expectedPaymentDate ?? '');
    setDescription(tx.description ?? '');
    setFormError(null);
    setEditing(true);
  }

  // Arriving from "set a new expected date" links.
  useEffect(() => {
    if (wantsExpected && tx && !autoOpened) {
      setAutoOpened(true);
      openEdit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantsExpected, tx, autoOpened]);

  const amountPaise = rupeesToPaise(amount);
  const amountError = amountPaise === null || amountPaise <= 0 ? t('Enter an amount greater than zero') : amountPaise < paid ? t('Amount cannot be less than what has already been paid') : null;
  const dateError = expected && expected < saleDate ? t('Expected date cannot be before the sale date') : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || amountError || dateError || amountPaise === null) return;
    setBusy(true);
    setFormError(null);
    try {
      await updateCreditTransaction(id, {
        amountPaise,
        transactionDate: saleDate,
        expectedPaymentDate: expected || null,
        description: description.trim() || null,
      });
      setEditing(false);
      reload();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteCreditTransaction(id);
      router.replace(`/customers/${tx!.customerId}`);
    } catch (err) {
      setFormError(errorMessage(err));
      setConfirmDelete(false);
      setBusy(false);
    }
  }

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      {data && tx && (
        <>
          <PageHeader
            title={t('Credit on {date}', { date: formatDate(tx.transactionDate) })}
            description={data.customer.name}
            backHref={`/customers/${tx.customerId}`}
            backLabel={data.customer.name}
            actions={
              <>
                <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> {t('Edit')}</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> {t('Delete')}</Button>
              </>
            }
          />
          {formError && !editing && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}

          {notInForecast && (
            <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 border-warning/40 bg-warning/5 p-4">
              <div className="min-w-0 text-sm">
                <p className="font-medium">{t('This payment is not counted in your forecast')}</p>
                <p className="text-muted-foreground">
                  {tx.expectedPaymentDate
                    ? t('It was expected on {date} and has not arrived. Set a new expected date to include it again.', { date: formatDate(tx.expectedPaymentDate) })
                    : t('It has no expected date. Add one to include it in the forecast.')}
                </p>
              </div>
              <Button size="sm" onClick={openEdit}><CalendarClock className="h-4 w-4" /> {t('Set expected date')}</Button>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t('Credit amount')}</p><AmountDisplay paise={tx.amountPaise} size="lg" /></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t('Received so far')}</p><AmountDisplay paise={paid} size="lg" tone="positive" /></Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Still owed')}</p>
              <AmountDisplay paise={data.remaining_amount_paise} size="lg" />
              <div className="mt-1"><StatusBadge status={data.remaining_amount_paise === 0 ? 'paid' : tx.expectedPaymentDate && tx.expectedPaymentDate < today ? 'overdue' : paid > 0 ? 'partially_paid' : 'pending'} /></div>
            </Card>
          </div>

          <dl className="my-5 grid grid-cols-2 gap-y-1 text-sm sm:max-w-md">
            <dt className="text-muted-foreground">{t('Date of sale')}</dt><dd>{formatDate(tx.transactionDate)}</dd>
            <dt className="text-muted-foreground">{t('Expected payment date')}</dt><dd>{tx.expectedPaymentDate ? formatDate(tx.expectedPaymentDate) : t('Not known (left out of the forecast)')}</dd>
            {tx.description && (<><dt className="text-muted-foreground">{t('What was sold?')}</dt><dd>{tx.description}</dd></>)}
          </dl>

          <div className="mb-6 flex flex-wrap gap-2">
            {data.remaining_amount_paise > 0 && (
              <Button asChild><Link href={`/customer-payments/new?customer_id=${tx.customerId}&credit_transaction_id=${id}`}><HandCoins className="h-4 w-4" /> {t('Record payment')}</Link></Button>
            )}
            {data.remaining_amount_paise > 0 && tx.expectedPaymentDate && tx.expectedPaymentDate >= today && (
              <Button asChild variant="outline"><Link href={`/what-if-simulator?credit_transaction_id=${id}`}>{t('Try a what-if')}</Link></Button>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle>{t('Payments received')}</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              {payments.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('No payments yet.')}</p>}
              {payments.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className={p.reversed ? 'text-sm font-medium text-muted-foreground line-through' : 'text-sm font-medium'}>{formatDate(p.payment_date)} · {p.payment_method.toUpperCase()}</p>
                    {p.payment_amount_paise !== p.amount_paise && <p className="text-xs text-muted-foreground">{t('Part of a {amount} payment', { amount: formatPaise(p.payment_amount_paise) })}</p>}
                    {p.reversed && <p className="text-xs text-muted-foreground">{t('Reversed')}: {p.reversal_reason}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <AmountDisplay paise={p.amount_paise} tone={p.reversed ? 'neutral' : 'positive'} className={p.reversed ? 'line-through' : ''} />
                    {p.reversed ? (
                      <Badge variant="secondary">{t('Reversed')}</Badge>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setReversing({ id: p.id, amountPaise: p.payment_amount_paise, date: p.payment_date })}>
                        <Undo2 className="h-4 w-4" /> {t('Reverse')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Edit credit')}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="flex flex-col gap-4" noValidate>
                {formError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
                <FormField label={t('Amount')} htmlFor="c-amount" error={amountError} helper={paid > 0 ? t('{amount} has already been received.', { amount: formatPaise(paid) }) : undefined} required>
                  <MoneyInput id="c-amount" value={amount} onValueChange={setAmount} />
                </FormField>
                <FormField label={t('Date of sale')} htmlFor="c-date" required>
                  <Input id="c-date" type="date" max={today} value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
                </FormField>
                <FormField
                  label={t('Expected payment date')}
                  htmlFor="c-expected"
                  helper={t('Choose today or a later date to include this payment in your forecast.')}
                  error={dateError}
                >
                  <Input id="c-expected" type="date" value={expected} onChange={(e) => setExpected(e.target.value)} />
                </FormField>
                <FormField label={t('What was sold? (optional)')} htmlFor="c-desc">
                  <Input id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
                </FormField>
                <p className="text-xs text-muted-foreground">{t('Every change is recorded in the activity log with the old and new value.')}</p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
                  <Button type="submit" disabled={busy || !!amountError || !!dateError}>{busy ? t('Saving…') : t('Save changes')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title={t('Delete this credit?')}
            description={t('This cannot be undone. A credit that has payment history cannot be deleted.')}
            confirmLabel={t('Delete')}
            destructive
            loading={busy}
            onConfirm={remove}
          />
          <ReversePaymentDialog payment={reversing} kind="customer" onClose={() => setReversing(null)} onReverse={async (pid, reason) => { await createCustomerPaymentReverse(pid, { reason }); reload(); }} />
        </>
      )}
    </DataState>
  );
}

export default function CreditDetailPage() {
  return (
    <AppShell>
      <Suspense fallback={null}>
        <CreditDetail />
      </Suspense>
    </AppShell>
  );
}
