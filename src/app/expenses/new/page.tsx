'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createExpens } from '@/lib/api';
import { addDays, cn, errorMessage, formatDate, formatPaise, newIdempotencyKey, rupeesToPaise, todayIST } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { ReviewDialog } from '@/components/ReviewDialog';
import { MoneyInput } from '@/components/MoneyInput';
import { NativeSelect } from '@/components/NativeSelect';

import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';


const CATEGORIES = [
  ['rent', 'Rent'],
  ['electricity', 'Electricity'],
  ['wages', 'Wages'],
  ['transport', 'Transport'],
  ['other', 'Other'],
] as const;

type Method = 'cash' | 'upi' | 'bank';

function Form() {
  const { t } = useLanguage();
  const router = useRouter();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>('rent');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayIST());
  const [paid, setPaid] = useState(false);
  const [dueDate, setDueDate] = useState(addDays(todayIST(), 7));
  const [paymentDate, setPaymentDate] = useState(todayIST());
  const [method, setMethod] = useState<Method>('cash');
  const [description, setDescription] = useState('');
  const [key] = useState(newIdempotencyKey);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(amount !== '' || description !== '');
  const [review, setReview] = useState(false);

  const paise = amount === '' ? null : rupeesToPaise(amount);
  const valid = paise !== null && paise > 0 && (paid ? paymentDate <= todayIST() : !!dueDate);

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
      await createExpens({
        category,
        amountPaise: paise,
        expenseDate,
        status: paid ? 'paid' : 'unpaid',
        dueDate: paid ? null : dueDate,
        paymentDate: paid ? paymentDate : null,
        paymentMethod: paid ? method : null,
        description: description.trim() || null,
        idempotencyKey: key,
      });
      router.replace('/expenses');
    } catch (err) {
      setError(errorMessage(err));
      setReview(false);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Add expense')} backHref="/expenses" backLabel={t('Expenses')} />
      <Card className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <FormField label={t('Category')} htmlFor="category" required>
            <NativeSelect id="category" value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
            </NativeSelect>
          </FormField>
          <FormField label={t('Amount')} htmlFor="amount" error={amount !== '' && (paise === null || paise <= 0) ? t('Enter an amount greater than zero') : null} required>
            <MoneyInput id="amount" value={amount} onValueChange={setAmount} placeholder="0" />
          </FormField>
          <FormField label={t('Expense date')} htmlFor="expenseDate" required>
            <Input id="expenseDate" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          </FormField>
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium">{t('Is it already paid?')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((v) => (
                <label key={String(v)} className={cn('flex h-11 cursor-pointer items-center justify-center rounded-md border text-sm font-medium', paid === v ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-accent')}>
                  <input type="radio" name="paid" className="sr-only" checked={paid === v} onChange={() => setPaid(v)} />
                  {v ? t('Paid already') : t('Not paid yet')}
                </label>
              ))}
            </div>
          </fieldset>
          {paid ? (
            <>
              <FormField label={t('Date paid')} htmlFor="paymentDate" error={paymentDate > todayIST() ? t('Date cannot be in the future') : null} required>
                <Input id="paymentDate" type="date" max={todayIST()} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} />
              </FormField>
              <FormField label={t('How was it paid?')} htmlFor="method">
                <NativeSelect id="method" value={method} onChange={(e) => setMethod(e.target.value as Method)}>
                  <option value="cash">{t('Cash')}</option>
                  <option value="upi">{t('UPI')}</option>
                  <option value="bank">{t('Bank')}</option>
                </NativeSelect>
              </FormField>
            </>
          ) : (
            <FormField label={t('Due date')} htmlFor="dueDate" helper={t('It will appear in your cash forecast on this date.')} required>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </FormField>
          )}
          <FormField label={t('Note (optional)')} htmlFor="desc"><Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} /></FormField>
          <Button type="submit" disabled={busy || !valid}>{busy ? t('Saving…') : t('Save expense')}</Button>
        </form>
          <ReviewDialog
            open={review}
            onOpenChange={setReview}
            busy={busy}
            onConfirm={save}
            rows={[
              { label: t('Category'), value: t(CATEGORIES.find(([v]) => v === category)?.[1] ?? 'Other') },
              { label: t('Amount'), value: formatPaise(paise ?? 0) },
              { label: t('Expense date'), value: formatDate(expenseDate) },
              paid
                ? { label: t('Paid on'), value: `${formatDate(paymentDate)} · ${t(method === 'cash' ? 'Cash' : method === 'upi' ? 'UPI' : 'Bank')}` }
                : { label: t('Due date'), value: formatDate(dueDate) },
              ...(description.trim() ? [{ label: t('Note'), value: description.trim() }] : []),
            ]}
            note={paid ? t('This reduces your available cash by this amount.') : t('Not paid yet: it will appear in your forecast on the due date, not in your cash.')}
          />
      </Card>
    </div>
  );
}

export default function NewExpensePage() {
  return (
    <AppShell>
      <Form />
    </AppShell>
  );
}
