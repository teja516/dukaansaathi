'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createCustomer } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';
import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function NewCustomer() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(name !== '' || phone !== '' || notes !== '');
  const [duplicate, setDuplicate] = useState(false);

  async function save(confirmDuplicate: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const c = await createCustomer({ name: name.trim(), phoneNumber: phone.trim() || null, notes: notes.trim() || null, ...(confirmDuplicate ? { confirmDuplicate: true } : {}) } as Parameters<typeof createCustomer>[0]);
      router.replace(`/customers/${c.id}`);
    } catch (err) {
      setDuplicate(/already exists/i.test(String(err instanceof Error ? err.message : err)) && /name/i.test(String(err instanceof Error ? err.message : err)));
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void save(false);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Add customer')} backHref="/customers" backLabel={t('Customers')} />
      <Card className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p>{error}</p>
              {duplicate && <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void save(true)} disabled={busy}>{t('Save anyway')}</Button>}
            </div>
          )}
          <FormField label={t('Customer name')} htmlFor="name" required>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </FormField>
          <FormField label={t('Phone number (optional)')} htmlFor="phone" helper={t('Used for reminders. Not shared with anyone.')}>
            <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label={t('Notes (optional)')} htmlFor="notes">
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <Button type="submit" disabled={busy || !name.trim()}>{busy ? t('Saving…') : t('Save customer')}</Button>
        </form>
      </Card>
    </div>
  );
}

export default function NewCustomerPage() {
  return (
    <AppShell>
      <NewCustomer />
    </AppShell>
  );
}
