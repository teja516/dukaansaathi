'use client';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { createAuthForgotPassword } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await createAuthForgotPassword({ email });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t('Reset your password')} description={t('Enter your email and we will prepare a reset link.')}>
      {done ? (
        <div className="space-y-4">
          <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            {t('If an account exists for that email, a reset link has been prepared.')}
          </p>
          <Link href="/login" className="inline-flex min-h-10 items-center text-sm text-primary hover:underline">{t('Back to sign in')}</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <FormField label={t('Email')} htmlFor="email" required>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FormField>
          <Button type="submit" disabled={busy || !email}>{busy ? t('Please wait…') : t('Send reset link')}</Button>
          <Link href="/login" className="inline-flex min-h-10 items-center text-sm text-primary hover:underline">{t('Back to sign in')}</Link>
        </form>
      )}
    </AuthLayout>
  );
}
