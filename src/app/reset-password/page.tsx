'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { createAuthResetPassword } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function ResetForm() {
  const { t } = useLanguage();
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mismatch = confirm.length > 0 && confirm !== password;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || mismatch) return;
    setBusy(true);
    setError(null);
    try {
      await createAuthResetPassword({ token, password });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!token) return <p className="text-sm text-destructive">{t('This reset link is invalid or has expired')}</p>;
  if (done) {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{t('Your password has been changed.')}</p>
        <Link href="/login" className="inline-flex min-h-10 items-center text-sm text-primary hover:underline">{t('Sign in')}</Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <FormField label={t('New password')} htmlFor="password" helper={t('At least 8 characters.')} required>
        <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </FormField>
      <FormField label={t('Confirm new password')} htmlFor="confirm" error={mismatch ? t('Passwords do not match') : null} required>
        <Input id="confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </FormField>
      <Button type="submit" disabled={busy || password.length < 8 || password !== confirm}>{busy ? t('Please wait…') : t('Change password')}</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  return (
    <AuthLayout title={t('Choose a new password')}>
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
