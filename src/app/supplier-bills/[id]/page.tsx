'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Banknote, Pencil, Trash2, Undo2 } from 'lucide-react';
import { getSupplierBillById, updateSupplierBill, deleteSupplierBill, createSupplierPaymentReverse } from '@/lib/api';
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

interface BillPayment {
  id: string;
  amountPaise: number;
  paymentAmountPaise?: number;
  paymentDate: string;
  paymentMethod: string;
  reversedAt?: string | null;
  reversalReason?: string | null;
}

function BillDetail() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => getSupplierBillById(id), [id]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [billDate, setBillDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reference, setReference] = useState('');
  const [reversing, setReversing] = useState<{ id: string; amountPaise: number; date: string } | null>(null);

  const bill = data?.bill;
  const payments = (data?.payments ?? []) as unknown as BillPayment[];
  const paid = data?.paid_amount_paise ?? 0;

  function openEdit() {
    if (!bill) return;
    setAmount(String(bill.amountPaise / 100));
    setBillDate(bill.billDate);
    setDueDate(bill.dueDate);
    setReference(bill.reference ?? '');
    setActionError(null);
    setEditing(true);
  }

  const amountPaise = rupeesToPaise(amount);
  const amountError = amountPaise === null || amountPaise <= 0 ? t('Enter an amount greater than zero') : amountPaise < paid ? t('Amount cannot be less than what has already been paid') : null;
  const dateError = dueDate < billDate ? t('Due date cannot be before the bill date') : null;

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy || amountError || dateError || amountPaise === null) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateSupplierBill(id, { amountPaise, billDate, dueDate, reference: reference.trim() || null });
      setEditing(false);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deleteSupplierBill(id);
      router.replace('/supplier-bills');
    } catch (err) {
      setActionError(errorMessage(err));
      setConfirmDelete(false);
      setBusy(false);
    }
  }

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      {data && bill && (
        <>
          <PageHeader
            title={t('Supplier bill')}
            description={bill.reference ?? undefined}
            backHref={`/suppliers/${bill.supplierId}`}
            backLabel={t('Supplier')}
            actions={
              <>
                <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> {t('Edit')}</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> {t('Delete')}</Button>
              </>
            }
          />
          {actionError && !editing && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t('Bill amount')}</p><AmountDisplay paise={bill.amountPaise} size="lg" /></Card>
            <Card className="p-4"><p className="text-sm text-muted-foreground">{t('Paid so far')}</p><AmountDisplay paise={data.paid_amount_paise} size="lg" tone="positive" /></Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Still to pay')}</p>
              <AmountDisplay paise={data.remaining_amount_paise} size="lg" />
              <div className="mt-1"><StatusBadge status={data.remaining_amount_paise > 0 && bill.dueDate < todayIST() ? 'overdue' : bill.status} /></div>
            </Card>
          </div>
          <p className="my-4 text-sm text-muted-foreground">{t('Billed {date}', { date: formatDate(bill.billDate) })} · {t('Due {date}', { date: formatDate(bill.dueDate) })}</p>
          {data.remaining_amount_paise > 0 && (
            <Button asChild className="mb-6"><Link href={`/supplier-payments/new?supplier_bill_id=${id}`}><Banknote className="h-4 w-4" /> {t('Pay this bill')}</Link></Button>
          )}
          <Card>
            <CardHeader><CardTitle>{t('Payments made')}</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              {payments.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('No payments yet.')}</p>}
              {payments.map((p) => {
                const reversed = !!p.reversedAt;
                const whole = p.paymentAmountPaise ?? p.amountPaise;
                return (
                  <div key={p.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className={reversed ? 'text-sm font-medium text-muted-foreground line-through' : 'text-sm font-medium'}>{formatDate(p.paymentDate)} · {p.paymentMethod.toUpperCase()}</p>
                      {whole !== p.amountPaise && <p className="text-xs text-muted-foreground">{t('Part of a {amount} payment', { amount: formatPaise(whole) })}</p>}
                      {reversed && <p className="text-xs text-muted-foreground">{t('Reversed')}: {p.reversalReason}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <AmountDisplay paise={p.amountPaise} tone={reversed ? 'neutral' : 'negative'} className={reversed ? 'line-through' : ''} />
                      {reversed ? (
                        <Badge variant="secondary">{t('Reversed')}</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setReversing({ id: p.id, amountPaise: whole, date: p.paymentDate })}>
                          <Undo2 className="h-4 w-4" /> {t('Reverse')}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Edit supplier bill')}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="flex flex-col gap-4" noValidate>
                {actionError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
                <FormField label={t('Bill amount')} htmlFor="b-amount" error={amountError} helper={paid > 0 ? t('{amount} has already been paid.', { amount: formatPaise(paid) }) : undefined} required>
                  <MoneyInput id="b-amount" value={amount} onValueChange={setAmount} />
                </FormField>
                <FormField label={t('Bill date')} htmlFor="b-date" required><Input id="b-date" type="date" max={todayIST()} value={billDate} onChange={(e) => setBillDate(e.target.value)} /></FormField>
                <FormField label={t('Due date')} htmlFor="b-due" error={dateError} required><Input id="b-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
                <FormField label={t('Bill number / note (optional)')} htmlFor="b-ref"><Input id="b-ref" value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} /></FormField>
                <p className="text-xs text-muted-foreground">{t('Every change is recorded in the activity log with the old and new value.')}</p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
                  <Button type="submit" disabled={busy || !!amountError || !!dateError}>{busy ? t('Saving…') : t('Save changes')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title={t('Delete this bill?')} description={t('This cannot be undone. A bill that has payment history cannot be deleted.')} confirmLabel={t('Delete')} destructive loading={busy} onConfirm={remove} />
          <ReversePaymentDialog payment={reversing} kind="supplier" onClose={() => setReversing(null)} onReverse={async (pid, reason) => { await createSupplierPaymentReverse(pid, { reason }); reload(); }} />
        </>
      )}
    </DataState>
  );
}

export default function SupplierBillDetailPage() {
  return (
    <AppShell>
      <BillDetail />
    </AppShell>
  );
}
