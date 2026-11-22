'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { createAuthRegister, createAuthLogin } from '@/lib/api';
import { errorMessage } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { AuthLayout } from '@/components/AuthLayout';
import { FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const tooShort = password.length > 0 && password.length < 8;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy || tooShort) return;
    setBusy(true);
    setError(null);
    try {
      await createAuthRegister({ name, email, password });
      await createAuthLogin({ email, password });
      router.replace('/welcome-and-shop-setup');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <AuthLayout title={t('Create your account')} description={t('Start tracking udhaar, supplier bills and cash in minutes.')}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <FormField label={t('Your name')} htmlFor="name" required>
          <Input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label={t('Email')} htmlFor="email" required>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </FormField>
        <FormField label={t('Password')} htmlFor="password" helper={t('At least 8 characters.')} error={tooShort ? t('Password must be at least 8 characters') : null} required>
          <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </FormField>
        <Button type="submit" disabled={busy || !name || !email || password.length < 8}>{busy ? t('Please wait…') : t('Create account')}</Button>
        <p className="text-sm">
          {t('Already have an account?')} <Link href="/login" className="text-primary hover:underline">{t('Sign in')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
