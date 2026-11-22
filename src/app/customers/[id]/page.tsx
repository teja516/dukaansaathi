'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { MessageSquareText, HandCoins, ReceiptText, Pencil, Trash2, Undo2 } from 'lucide-react';
import { getCustomerById, updateCustomer, deleteCustomer, createCustomerPaymentReverse } from '@/lib/api';
import { errorMessage, formatDate, todayIST } from '@/lib/utils';
import { useAsync } from '@/hooks/useAsync';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/PageHeader';
import { DataState } from '@/components/DataState';
import { AmountDisplay } from '@/components/AmountDisplay';
import { StatusBadge } from '@/components/StatusBadge';
import { TransactionListRow } from '@/components/TransactionListRow';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ReversePaymentDialog } from '@/components/ReversePaymentDialog';
import { Badge } from '@/components/ui/badge';
import { FormField } from '@/components/FormField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function CustomerDetail() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => getCustomerById(id), [id]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reversing, setReversing] = useState<{ id: string; amountPaise: number; date: string } | null>(null);

  function openEdit() {
    if (!data) return;
    setName(data.customer.name);
    setPhone(data.customer.phoneNumber ?? '');
    setNotes(data.customer.notes ?? '');
    setFormError(null);
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await updateCustomer(id, { name: name.trim(), phoneNumber: phone.trim() || null, notes: notes.trim() || null });
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
    setFormError(null);
    try {
      await deleteCustomer(id);
      router.replace('/customers');
    } catch (err) {
      setFormError(errorMessage(err));
      setConfirmDelete(false);
      setBusy(false);
    }
  }

  return (
    <DataState loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <PageHeader
            title={data.customer.name}
            description={data.customer.phoneNumber ?? t('No phone number')}
            backHref="/customers"
            backLabel={t('Customers')}
            actions={
              <>
                <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> {t('Edit')}</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> {t('Delete')}</Button>
              </>
            }
          />
          <div className="sticky top-14 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
            <span className="truncate text-sm font-medium">{data.customer.name}</span>
            <span className="flex items-center gap-2 text-sm">
              {t('Outstanding')}: <AmountDisplay paise={data.outstanding_paise} tone={data.overdue_paise > 0 ? 'negative' : 'neutral'} />
            </span>
          </div>
          {formError && !editing && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}

          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Outstanding')}</p>
              <AmountDisplay paise={data.outstanding_paise} size="lg" />
              <div className="mt-1"><StatusBadge status={data.outstanding_paise === 0 ? 'clear' : data.overdue_paise > 0 ? 'overdue' : data.payment_history.length > 0 ? 'partial' : 'pending'} /></div>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Overdue')}</p>
              <AmountDisplay paise={data.overdue_paise} size="lg" tone={data.overdue_paise > 0 ? 'negative' : 'neutral'} />
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Oldest unpaid since')}</p>
              <p className="text-lg font-semibold">{formatDate(data.oldest_unpaid_date)}</p>
            </Card>
          </div>

          <div className="my-5 flex flex-wrap gap-2">
            <Button asChild><Link href={`/credit-sales/new?customer_id=${id}`}><ReceiptText className="h-4 w-4" /> {t('Add credit')}</Link></Button>
            <Button asChild variant="secondary"><Link href={`/customer-payments/new?customer_id=${id}`}><HandCoins className="h-4 w-4" /> {t('Record payment')}</Link></Button>
            <Button asChild variant="outline"><Link href={`/payment-reminder-draft?customer_id=${id}`}><MessageSquareText className="h-4 w-4" /> {t('Reminder message')}</Link></Button>
          </div>

          {data.customer.notes && <p className="mb-5 rounded-md bg-muted px-3 py-2 text-sm">{data.customer.notes}</p>}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t('Unpaid credit')}</CardTitle></CardHeader>
              <CardContent className="divide-y p-0">
                {data.unpaid_credit_transactions.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('Nothing is unpaid.')}</p>}
                {data.unpaid_credit_transactions.map((c) => (
                  <TransactionListRow
                    key={c.id}
                    title={t('Credit on {date}', { date: formatDate(c.transaction_date) })}
                    subtitle={c.expected_payment_date ? t('Expected {date}', { date: formatDate(c.expected_payment_date) }) : t('No expected date')}
                    amountPaise={c.remaining_amount_paise}
                    badge={<StatusBadge status={c.expected_payment_date && c.expected_payment_date < todayIST() ? 'overdue' : c.status} />}
                    href={`/credit-sales/${c.id}`}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('Payments received')}</CardTitle></CardHeader>
              <CardContent className="divide-y p-0">
                {data.payment_history.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('No payments yet.')}</p>}
                {(data.payment_history as unknown as { id: string; amount_paise: number; payment_date: string; payment_method: string; reversed?: boolean; reversal_reason?: string | null }[]).map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className={p.reversed ? 'text-sm font-medium text-muted-foreground line-through' : 'text-sm font-medium'}>{formatDate(p.payment_date)}</p>
                      <p className="text-xs text-muted-foreground">{p.payment_method.toUpperCase()}{p.reversed ? ` · ${t('Reversed')}: ${p.reversal_reason ?? ''}` : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <AmountDisplay paise={p.amount_paise} tone={p.reversed ? 'neutral' : 'positive'} className={p.reversed ? 'line-through' : ''} />
                      {p.reversed ? (
                        <Badge variant="secondary">{t('Reversed')}</Badge>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => setReversing({ id: p.id, amountPaise: p.amount_paise, date: p.payment_date })}><Undo2 className="h-4 w-4" /> {t('Reverse')}</Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader><CardTitle>{t('Timeline')}</CardTitle></CardHeader>
            <CardContent className="divide-y p-0">
              {data.timeline.map((e) => (
                <TransactionListRow
                  key={`${e.type}-${e.source_id}`}
                  title={e.type === 'payment' ? t('Payment received') : t('Credit given')}
                  subtitle={formatDate(e.date)}
                  amountPaise={e.amount_paise}
                  direction={e.type === 'payment' ? 'in' : 'neutral'}
                />
              ))}
            </CardContent>
          </Card>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Edit customer')}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="flex flex-col gap-4" noValidate>
                {formError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
                <FormField label={t('Customer name')} htmlFor="e-name" required>
                  <Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} />
                </FormField>
                <FormField label={t('Phone number (optional)')} htmlFor="e-phone">
                  <Input id="e-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </FormField>
                <FormField label={t('Notes (optional)')} htmlFor="e-notes">
                  <Textarea id="e-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </FormField>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
                  <Button type="submit" disabled={busy || !name.trim()}>{busy ? t('Saving…') : t('Save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <ReversePaymentDialog payment={reversing} kind="customer" onClose={() => setReversing(null)} onReverse={async (pid, reason) => { await createCustomerPaymentReverse(pid, { reason }); reload(); }} />
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            title={t('Delete this customer?')}
            description={t('This cannot be undone. Customers with credit history cannot be deleted.')}
            confirmLabel={t('Delete')}
            destructive
            loading={busy}
            onConfirm={remove}
          />
        </>
      )}
    </DataState>
  );
}

export default function CustomerDetailPage() {
  return (
    <AppShell>
      <CustomerDetail />
    </AppShell>
  );
}
