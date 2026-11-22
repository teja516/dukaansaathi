'use client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Banknote, Pencil, ReceiptText, Trash2 } from 'lucide-react';
import { getSupplierById, updateSupplier, deleteSupplier } from '@/lib/api';
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
import { FormField } from '@/components/FormField';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function SupplierDetail() {
  const { t } = useLanguage();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useAsync(() => getSupplierById(id), [id]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function openEdit() {
    if (!data) return;
    setName(data.supplier.name);
    setPhone(data.supplier.phoneNumber ?? '');
    setNotes(data.supplier.notes ?? '');
    setFormError(null);
    setEditing(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setFormError(null);
    try {
      await updateSupplier(id, { name: name.trim(), phoneNumber: phone.trim() || null, notes: notes.trim() || null });
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
      await deleteSupplier(id);
      router.replace('/suppliers');
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
            title={data.supplier.name}
            description={data.supplier.phoneNumber ?? t('No phone number')}
            backHref="/suppliers"
            backLabel={t('Suppliers')}
            actions={
              <>
                <Button variant="outline" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> {t('Edit')}</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 className="h-4 w-4" /> {t('Delete')}</Button>
              </>
            }
          />
          {formError && !editing && <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('You owe')}</p>
              <AmountDisplay paise={data.payable_paise} size="lg" />
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">{t('Next due date')}</p>
              <p className="text-lg font-semibold">{formatDate(data.nearest_unpaid_due_date)}</p>
            </Card>
          </div>
          <div className="my-5 flex flex-wrap gap-2">
            <Button asChild><Link href={`/supplier-bills/new?supplier_id=${id}`}><ReceiptText className="h-4 w-4" /> {t('Add supplier bill')}</Link></Button>
            <Button asChild variant="secondary"><Link href={`/supplier-payments/new?supplier_id=${id}`}><Banknote className="h-4 w-4" /> {t('Pay supplier')}</Link></Button>
          </div>
          {data.supplier.notes && <p className="mb-5 rounded-md bg-muted px-3 py-2 text-sm">{data.supplier.notes}</p>}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t('Bills')}</CardTitle></CardHeader>
              <CardContent className="divide-y p-0">
                {data.bills.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('No bills yet.')}</p>}
                {data.bills.map((b) => (
                  <TransactionListRow
                    key={b.id}
                    title={t('Due {date}', { date: formatDate(b.due_date) })}
                    subtitle={t('Billed {date}', { date: formatDate(b.bill_date) })}
                    amountPaise={b.remaining_amount_paise}
                    badge={<StatusBadge status={b.remaining_amount_paise > 0 && b.due_date < todayIST() ? 'overdue' : b.status} />}
                    href={`/supplier-bills/${b.id}`}
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t('Payments made')}</CardTitle></CardHeader>
              <CardContent className="divide-y p-0">
                {data.payments.length === 0 && <p className="px-5 pb-5 text-sm text-muted-foreground">{t('No payments yet.')}</p>}
                {(data.payments as unknown as { id: string; amount_paise: number; payment_date: string; payment_method: string; supplier_bill_id: string; reversed?: boolean }[]).map((p) => (
                  <TransactionListRow
                    key={p.id}
                    title={formatDate(p.payment_date)}
                    subtitle={`${p.payment_method.toUpperCase()}${p.reversed ? ` · ${t('Reversed')}` : ''}`}
                    amountPaise={p.amount_paise}
                    direction={p.reversed ? 'neutral' : 'out'}
                    href={`/supplier-bills/${p.supplier_bill_id}`}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <Dialog open={editing} onOpenChange={setEditing}>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('Edit supplier')}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="flex flex-col gap-4" noValidate>
                {formError && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
                <FormField label={t('Supplier name')} htmlFor="e-name" required><Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} /></FormField>
                <FormField label={t('Phone number (optional)')} htmlFor="e-phone"><Input id="e-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></FormField>
                <FormField label={t('Notes (optional)')} htmlFor="e-notes"><Textarea id="e-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>{t('Cancel')}</Button>
                  <Button type="submit" disabled={busy || !name.trim()}>{busy ? t('Saving…') : t('Save')}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title={t('Delete this supplier?')} description={t('This cannot be undone. Suppliers with bills or payments cannot be deleted.')} confirmLabel={t('Delete')} destructive loading={busy} onConfirm={remove} />
        </>
      )}
    </DataState>
  );
}

export default function SupplierDetailPage() {
  return (
    <AppShell>
      <SupplierDetail />
    </AppShell>
  );
}
