'use client';
import { useParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { CheckCircle2, Pencil, XCircle } from 'lucide-react';
import { getExpensById, updateExpens, createExpensMarkPaid, createExpensCancel } from '@/lib/api';
import { errorMessage, formatDate, rupeesToPaise, todayIST } from '@/lib/utils';
import { MoneyInput } from '@/components/MoneyInput';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { AmountDisplay } from '@/components/AmountDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { FormField } from '@/components/FormField';
import { NativeSelect } from '@/components/NativeSelect';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const LABELS: Record<string, string> = { rent: 'Rent', electricity: 'Electricity', wages: 'Wages', transport: 'Transport', other: 'Other' };

function ExpenseDetail() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => getExpensById(id), [id]);
  const [paying, setPaying] = useState(false);
  const [date, setDate] = useState(todayIST());
  const [method, setMethod] = useState('cash');
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [eCategory, setECategory] = useState('rent');
  const [eAmount, setEAmount] = useState('');
  const [eDate, setEDate] = useState('');
  const [eDue, setEDue] = useState('');
  const [eDesc, setEDesc] = useState('');

  function openEdit() {
    if (!data) return;
    setECategory(data.category);
    setEAmount(String(data.amountPaise / 100));
    setEDate(data.expenseDate);
    setEDue(data.dueDate ?? '');
    setEDesc(data.description ?? '');
    setActionError(null);
    setEditing(true);
  }

  const eAmountPaise = rupeesToPaise(eAmount);
  const eAmountError = eAmountPaise === null || eAmountPaise <= 0 ? t('Enter an amount greater than zero') : null;

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (busy || eAmountError || eAmountPaise === null || !eDue) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateExpens(id, { category: eCategory, amountPaise: eAmountPaise, expenseDate: eDate, dueDate: eDue, description: eDesc.trim() || null });
      setEditing(false);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await createExpensMarkPaid(id, { payment_date: date, payment_method: method } as { payment_date: string });
      setPaying(false);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setActionError(null);
    try {
      await createExpensCancel(id, {});
      setCancelling(false);
      reload();
    } catch (err) {
      setActionError(errorMessage(err));
      setCancelling(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <PageHeader title={data.description || t(LABELS[data.category] ?? data.category)} backHref="/expenses" backLabel={t('Expenses')} />
          {actionError && !paying && !editing && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <AmountDisplay paise={data.amountPaise} size="lg" />
              <StatusBadge status={data.status === 'unpaid' && data.dueDate && data.dueDate < todayIST() ? 'overdue' : data.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{t('Category')}</dt><dd>{t(LABELS[data.category] ?? data.category)}</dd>
              <dt className="text-muted-foreground">{t('Expense date')}</dt><dd>{formatDate(data.expenseDate)}</dd>
              {data.dueDate && (<><dt className="text-muted-foreground">{t('Due date')}</dt><dd>{formatDate(data.dueDate)}</dd></>)}
              {data.paymentDate && (<><dt className="text-muted-foreground">{t('Paid on')}</dt><dd>{formatDate(data.paymentDate)}</dd></>)}
              {data.paymentMethod && (<><dt className="text-muted-foreground">{t('Paid by')}</dt><dd>{data.paymentMethod.toUpperCase()}</dd></>)}
            </dl>
          </Card>
          {data.status === 'unpaid' && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => { setActionError(null); setPaying(true); }}><CheckCircle2 className="h-4 w-4" /> {t('Mark as paid')}</Button>
              <Button variant="outline" onClick={openEdit}><Pencil className="h-4 w-4" /> {t('Edit')}</Button>
              <Button variant="outline" onClick={() => setCancelling(true)}><XCircle className="h-4 w-4" /> {t('Cancel expense')}</Button>
            </div>
          )}
          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Edit expense')}</DialogTitle></DialogHeader>
              <form onSubmit={saveEdit} className="flex flex-col gap-4" noValidate>
                {actionError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
                <FormField label={t('Category')} htmlFor="e-cat">
                  <NativeSelect id="e-cat" value={eCategory} onChange={(e) => setECategory(e.target.value)}>
                    {Object.entries(LABELS).map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField label={t('Amount')} htmlFor="e-amt" error={eAmountError} required><MoneyInput id="e-amt" value={eAmount} onValueChange={setEAmount} /></FormField>
                <FormField label={t('Expense date')} htmlFor="e-date" required><Input id="e-date" type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} /></FormField>
                <FormField label={t('Due date')} htmlFor="e-due" required><Input id="e-due" type="date" value={eDue} onChange={(e) => setEDue(e.target.value)} /></FormField>
                <FormField label={t('Note (optional)')} htmlFor="e-desc"><Input id="e-desc" value={eDesc} onChange={(e) => setEDesc(e.target.value)} maxLength={200} /></FormField>
                <p className="text-xs text-muted-foreground">{t('Every change is recorded in the activity log with the old and new value.')}</p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
                  <Button type="submit" disabled={busy || !!eAmountError || !eDue}>{busy ? t('Saving…') : t('Save changes')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={paying} onOpenChange={setPaying}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Mark as paid')}</DialogTitle></DialogHeader>
              <form onSubmit={markPaid} className="flex flex-col gap-4" noValidate>
                {actionError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{actionError}</p>}
                <FormField label={t('Date paid')} htmlFor="paid-date" required><Input id="paid-date" type="date" max={todayIST()} value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
                <FormField label={t('How was it paid?')} htmlFor="paid-method">
                  <NativeSelect id="paid-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="cash">{t('Cash')}</option>
                    <option value="upi">{t('UPI')}</option>
                    <option value="bank">{t('Bank')}</option>
                  </NativeSelect>
                </FormField>
                <p className="text-xs text-muted-foreground">{t('This reduces your available cash by this amount.')}</p>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPaying(false)}>{t('Cancel')}</Button>
                  <Button type="submit" disabled={busy || date > todayIST()}>{busy ? t('Saving…') : t('Mark paid')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <ConfirmDialog open={cancelling} onOpenChange={setCancelling} title={t('Cancel this expense?')} description={t('It will be removed from your forecast. No money is recorded as paid.')} confirmLabel={t('Cancel expense')} destructive loading={busy} onConfirm={cancel} />
        </>
      )}
    </DataState>
  );
}

export default function ExpenseDetailPage() {
  return (
    <AppShell>
      <ExpenseDetail />
    </AppShell>
  );
}
