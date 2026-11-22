'use client';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createSupplier } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AppShell } from '@/components/AppShell';
import { useUnsavedGuard } from '@/hooks/useUnsavedGuard';

import { PageHeader } from '@/components/PageHeader';
import { FormField } from '@/components/FormField';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Textarea } from '@/components/ui/textarea';

function NewSupplier() {
  const { t } = useLanguage();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(name !== '' || phone !== '' || notes !== '');

  async function save(confirmDuplicate: boolean) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const s = await createSupplier({ name: name.trim(), phoneNumber: phone.trim() || null, notes: notes.trim() || null, ...(confirmDuplicate ? { confirmDuplicate: true } : {}) } as Parameters<typeof createSupplier>[0]);
      router.replace(`/suppliers/${s.id}`);
    } catch (err) {
      const msg = errorMessage(err);
      setDuplicate(/already exists/i.test(msg));
      setError(msg);
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void save(false);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('Add supplier')} backHref="/suppliers" backLabel={t('Suppliers')} />
      <Card className="p-5">
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && (
            <div role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p>{error}</p>
              {duplicate && <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => void save(true)} disabled={busy}>{t('Save anyway')}</Button>}
            </div>
          )}
          <FormField label={t('Supplier name')} htmlFor="name" required>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </FormField>
          <FormField label={t('Phone number (optional)')} htmlFor="phone">
            <Input id="phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label={t('Notes (optional)')} htmlFor="notes">
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <Button type="submit" disabled={busy || !name.trim()}>{busy ? t('Saving…') : t('Save supplier')}</Button>
        </form>
      </Card>
    </div>
  );
}

export default function NewSupplierPage() {
  return (
    <AppShell>
      <NewSupplier />
    </AppShell>
  );
}
